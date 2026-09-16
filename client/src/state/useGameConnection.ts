import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientIntent, GameState, OptionalRulesInput, PlayerSessionId, RoomState, ServerEvent } from "@morichup/shared";
import { getSocket } from "../lib/socket";
import { getLastRoomCode, saveLastRoomCode } from "../lib/session";

export type Screen = "landing" | "menu" | "lobby" | "game";

export interface ConnectionState {
  screen: Screen;
  sessionId: PlayerSessionId;
  roomState: RoomState | null;
  gameState: GameState | null;
  turnDeadline: number | null;
  events: ServerEvent[];
  error: string | null;
  reconnecting: boolean;
  goToMenu: () => void;
  createRoom: (nickname: string) => void;
  joinRoom: (code: string, nickname: string) => void;
  startGame: () => void;
  selectMap: (mapId: string) => void;
  setRules: (rules: OptionalRulesInput) => void;
  kickPlayer: (targetSessionId: PlayerSessionId) => void;
  leaveRoom: () => void;
  sendIntent: (intent: ClientIntent) => void;
  dismissError: () => void;
}

export function useGameConnection(sessionId: PlayerSessionId): ConnectionState {
  const [screen, setScreen] = useState<Screen>("landing");
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [turnDeadline, setTurnDeadline] = useState<number | null>(null);
  const [events, setEvents] = useState<ServerEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const roomCodeRef = useRef<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onRoomState = (state: RoomState) => {
      roomCodeRef.current = state.code;
      saveLastRoomCode(state.code);
      setRoomState(state);
      if (state.status === "lobby") setScreen((prev) => (prev === "game" ? prev : "lobby"));
    };
    const onGameState = (state: GameState) => {
      setGameState(state);
      setScreen("game");
    };
    const onGameEvents = (newEvents: ServerEvent[]) => {
      setEvents((prev) => [...newEvents, ...prev].slice(0, 40));
    };
    const onTurnTimer = (payload: { deadline: number } | null) => {
      setTurnDeadline(payload?.deadline ?? null);
    };

    socket.on("room_state", onRoomState);
    socket.on("game_state", onGameState);
    socket.on("game_events", onGameEvents);
    socket.on("turn_timer", onTurnTimer);

    // Rientro automatico: se eravamo in una stanza prima di un reload, ci riproviamo subito.
    const lastCode = getLastRoomCode();
    if (lastCode) {
      setReconnecting(true);
      socket.emit("rejoin", { sessionId, code: lastCode }, (res) => {
        setReconnecting(false);
        if (!res.ok) saveLastRoomCode(null);
      });
    }

    return () => {
      socket.off("room_state", onRoomState);
      socket.off("game_state", onGameState);
      socket.off("game_events", onGameEvents);
      socket.off("turn_timer", onTurnTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToMenu = useCallback(() => setScreen("menu"), []);
  const dismissError = useCallback(() => setError(null), []);

  const createRoom = useCallback(
    (nickname: string) => {
      getSocket().emit("create_room", { sessionId, nickname }, (res) => {
        if (!res.ok) setError(res.error);
      });
    },
    [sessionId]
  );

  const joinRoom = useCallback(
    (code: string, nickname: string) => {
      getSocket().emit("join_room", { sessionId, nickname, code: code.toUpperCase() }, (res) => {
        if (!res.ok) setError(res.error);
      });
    },
    [sessionId]
  );

  const startGame = useCallback(() => {
    const code = roomCodeRef.current;
    if (!code) return;
    getSocket().emit("start_game", { code }, (res) => {
      if (!res.ok) setError(res.error);
    });
  }, []);

  const selectMap = useCallback((mapId: string) => {
    const code = roomCodeRef.current;
    if (!code) return;
    getSocket().emit("select_map", { code, mapId }, (res) => {
      if (!res.ok) setError(res.error);
    });
  }, []);

  const setRules = useCallback((rules: OptionalRulesInput) => {
    const code = roomCodeRef.current;
    if (!code) return;
    getSocket().emit("set_rules", { code, rules }, (res) => {
      if (!res.ok) setError(res.error);
    });
  }, []);

  const kickPlayer = useCallback((targetSessionId: PlayerSessionId) => {
    const code = roomCodeRef.current;
    if (!code) return;
    getSocket().emit("kick_player", { code, targetSessionId }, (res) => {
      if (!res.ok) setError(res.error);
    });
  }, []);

  const leaveRoom = useCallback(() => {
    const code = roomCodeRef.current;
    if (!code) return;
    getSocket().emit("leave_room", { code });
    roomCodeRef.current = null;
    saveLastRoomCode(null);
    setRoomState(null);
    setGameState(null);
    setScreen("menu");
  }, []);

  const sendIntent = useCallback((intent: ClientIntent) => {
    const code = roomCodeRef.current;
    if (!code) return;
    getSocket().emit("game_intent", { code, intent }, (res) => {
      if (!res.ok) setError(res.error);
    });
  }, []);

  return {
    screen,
    sessionId,
    roomState,
    gameState,
    turnDeadline,
    events,
    error,
    reconnecting,
    goToMenu,
    createRoom,
    joinRoom,
    startGame,
    selectMap,
    setRules,
    kickPlayer,
    leaveRoom,
    sendIntent,
    dismissError,
  };
}
