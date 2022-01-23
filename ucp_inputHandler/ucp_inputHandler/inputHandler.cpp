#pragma once

#include "pch.h"

#include <winProcHandler.h>
#include "inputHandlerInternal.h"

#include "keyEnum.h"
#include <unordered_map>

namespace IHH = InputHandlerHeader; // easier to use

static std::unordered_map<std::string, KeyMap> keyMapMap{};
static KeyMap* currentKeyMap{ nullptr };
static KeyMap* defaultKeyMap{ nullptr };

static std::unordered_map<VK::VirtualKey, IHH::KeyEventFunc*> currentEvents{};

static CrusaderKeyState nativeState{};	// half of this is not used
static IHH::KeyEventFunc defaultFunc{ RetranslateToWindowProc };	// to be part of pipeline


bool InitStructures()
{
	auto iter{ keyMapMap.try_emplace("").first };	// no test, but it is first and must work
	currentKeyMap = &iter->second;
	defaultKeyMap = currentKeyMap;

	// test
	IHH::KeyEvent ev{ VK::SPACE, IHH::KeyStatus::RESET, 1, 1, 1};
	defaultKeyMap->registerKeyEvent(ev, [](IHH::KeyEvent ev, int windowProcPrio, HWND winHandle) {
		LuaLog::Log(LuaLog::LOG_INFO, "I am a secret message.");
		return false;
	});

	// here would be the place to create the redefines
	// other funcs need to register themselves

	return true;
}


// only used for one call
SHORT __stdcall GetAsyncKeyFake(int vKey)
{
	if (vKey == VK::DOWN)
	{
		return static_cast<short>(crusaderKeyState->downArrow);
	}
	else
	{
		LuaLog::Log(LuaLog::LOG_FATAL, "[InputHandler]: 'GetAsyncKeyFake' received key it can not handle.");
		return 0;
	}
}


LRESULT __stdcall ProcessInput(int reservedCurrentPrio, HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
	IHH::KeyStatus action{ IHH::KeyStatus::NONE };
	switch (uMsg)
	{
		case WM_SYSKEYUP:
		case WM_KEYUP:
			action = IHH::KeyStatus::KEY_UP;
			break;
		case WM_SYSKEYDOWN:
		case WM_KEYDOWN:
			action = lParam & 0x40000000 ? IHH::KeyStatus::KEY_HOLD : IHH::KeyStatus::KEY_DOWN;
			break;
		case WM_ACTIVATEAPP:
			if (wParam)	// at the moment only on activation (like all input)
			{
				action = IHH::KeyStatus::RESET;
			}
			break;
		case WM_CHAR:
		default:
			break;
	}

	if (action == IHH::KeyStatus::NONE)	// nothing to do, pass through
	{
		return WinProcHeader::CallNextProc(reservedCurrentPrio, hwnd, uMsg, wParam, lParam); // dummy currently
	}


	// a lot safety catching needs to happen here



	if (wParam <= VK::ALT && wParam >= VK::SHIFT)
	{
		BOOL modifier{ action == IHH::KeyStatus::KEY_HOLD || action == IHH::KeyStatus::KEY_DOWN };	// the others will be 0
		switch (wParam)
		{
			case VK::CONTROL:
			{
				crusaderKeyState->ctrl = modifier;
				nativeState.ctrl = modifier;
				break;
			}
			case VK::SHIFT:
			{
				crusaderKeyState->shift = modifier;
				nativeState.shift = modifier;
				break;
			}
			case VK::ALT:
			{
				crusaderKeyState->alt = modifier;
				nativeState.alt = modifier;
				
				// Crusader returns 1 in case of ALT; for the moment do the same
				// (Test with graphicsAPIReplacer was the same, but still keep it)
				// also, a windows sound plays if the graphicsAPIReplacer is used
				return 1;
			}
			default:
				break;
		}

		return 0; // consumed key
	}

	// create KeyEvent
	IHH::KeyEvent currentEvent{ static_cast<unsigned char>(wParam), action, static_cast<unsigned int>(nativeState.ctrl),
		static_cast<unsigned int>(nativeState.shift), static_cast<unsigned int>(nativeState.alt) };

	// reset here

	if (action == IHH::KeyStatus::RESET)	// dummy at the moment
	{
		auto iter{ currentEvents.begin() };
		while(iter != currentEvents.end()) {
			(*iter->second)(currentEvent, reservedCurrentPrio, hwnd);	// ignore output, we are resetting
			iter = currentEvents.erase(iter);	// delete, since we are done
		}
		return WinProcHeader::CallNextProc(reservedCurrentPrio, hwnd, uMsg, wParam, lParam); // send further
	}

	// handling existing actions here

	if (action != IHH::KeyStatus::KEY_DOWN)	// not sure if this should be the gate, or rather the key search
	{
		auto runningEvent{ currentEvents.find(static_cast<VK::VirtualKey>(wParam)) };
		if (runningEvent == currentEvents.end())
		{
			return 0;
		}

		bool res{ (*runningEvent->second)(currentEvent, reservedCurrentPrio, hwnd) };
		if (res || action == IHH::KeyStatus::KEY_UP)
		{
			currentEvents.erase(runningEvent);	// currently erasing -> if it turns out this is too slow, maybe switch to some approach that keeps the registered

			if (res)
			{
				return ProcessInput(reservedCurrentPrio, hwnd, WM_KEYDOWN, wParam, 0);	// sets it to a new keyDown, other stuff is context generated
			}
		}
		return 0;
	}

	// only key_downs from here

	IHH::KeyEventFunc* currentFunc{ currentKeyMap->getHandlerFunc(currentEvent) };
	if (!currentFunc)
	{
		if (currentKeyMap == defaultKeyMap)
		{
			currentFunc = &defaultFunc;
		}
		else
		{
			return 0;	// special KeyMap selected, devour
		}
	}

	currentEvents.insert_or_assign(static_cast<VK::VirtualKey>(wParam), currentFunc);
	(*currentFunc)(currentEvent, reservedCurrentPrio, hwnd);
  return 0; // consume
}


bool RetranslateToWindowProc(IHH::KeyEvent status, int windowProcPrio, HWND winHandle)
{
	if (status.status == IHH::KeyStatus::RESET)
	{
		switch (status.virtualKey)	// reset could also happen in real reset function? (keep it here for now)
		{
			case VK::DOWN:
				crusaderKeyState->downArrow = 0;
				break;
			case VK::V:
				crusaderKeyState->v = 0;
				break;
			default:
				break;
		}

		return false; // there is no other handling of resets in the default key handler
	}

	crusaderKeyState->ctrl = status.ctrlActive;
	crusaderKeyState->shift = status.shiftActive;
	crusaderKeyState->alt = status.altActive;

	UINT message{ 0 };
	long lParam{ 0 };
	if (status.status == IHH::KeyStatus::KEY_UP)
	{
		message = status.altActive ? WM_SYSKEYUP : WM_KEYUP;

		// the keys are set by the normal func, but the release is done here
		// NOTE, however, that this ignores ONE case where the down arrow state is only gathered through GetAsyncKeyState
		switch (status.virtualKey)
		{
			case VK::DOWN:
				crusaderKeyState->downArrow = 0;
				break;
			case VK::V:
				crusaderKeyState->v = 0;
				break;
			default:
				break;
		}
	}
	else
	{
		message = status.altActive ? WM_SYSKEYDOWN : WM_KEYDOWN;
	}
	if (status.status != IHH::KeyStatus::KEY_DOWN)
	{
		lParam |= 0x40000000;	// ignore other parameters for now, they seem unused
	}

	WinProcHeader::CallNextProc(windowProcPrio, winHandle, message, status.virtualKey, lParam);

	crusaderKeyState->ctrl = nativeState.ctrl;
	crusaderKeyState->shift = nativeState.shift;
	crusaderKeyState->alt = nativeState.alt;

	return false;	// input is only cared for on KEY_HOLD, freeing the key and sending a key down to the process again, launching the other key
}


IHH::KeyEventFunc* KeyMap::getHandlerFunc(IHH::KeyEvent ev)
{
	//unsigned int mapKey{ctrl << 24 | shift << 16 | alt << 8 | key};	// duplicate? would try to evade another func call, or not
	unsigned int mapKey{ev.ctrlActive << 24 | ev.shiftActive << 16 | ev.altActive << 8 | ev.virtualKey };	// duplicate? would try to evade another func call, or not
	auto res{ funcMap.find(mapKey) };
	return res != funcMap.end() ? &res->second : nullptr;
}

void KeyMap::registerKeyEvent(IHH::KeyEvent ev, IHH::KeyEventFunc&& func)
{
	//unsigned int mapKey{ ctrl << 24 | shift << 16 | alt << 8 | key }; // duplicate? would try to evade another func call, or not
	unsigned int mapKey{ ev.ctrlActive << 24 | ev.shiftActive << 16 | ev.altActive << 8 | ev.virtualKey };	// duplicate? would try to evade another func call, or not
	funcMap.insert_or_assign(mapKey, std::forward<IHH::KeyEventFunc>(func)); // should i trust the move stuff?
}


// example
//if (wParam == VK::BACKSPACE)
//{
//	keyMapMap.try_emplace("");
//	KeyMap* keyMap{ &keyMapMap.find("")->second };
//	keyMap->registerKeyEvent(true, true, true, VK::A,
//		[](IHH::KeyEvent) -> bool
//		{
//			return true;
//		});
//	IHH::KeyEventFunc* shouldBeNull{ keyMap->getHandlerFunc(true, true, true, VK::B) };
//	IHH::KeyEventFunc* shouldBeFunc{ keyMap->getHandlerFunc(true, true, true, VK::A) };
//	IHH::KeyEvent test{ IHH::KeyStatus::KEY_HOLD };
//	bool res{ (*shouldBeFunc)(test) };
//	int a{ 1 };
//}