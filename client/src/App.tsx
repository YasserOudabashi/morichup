import { useMemo, useState } from "react";
import { getSavedNickname, getSessionId } from "./lib/session";
import { parseJoinCodeFromUrl } from "./lib/url";
import { useGameConnection } from "./state/useGameConnection";
import { useLocale } from "./i18n";
import type { MatchHistoryEntry } from "./lib/matchHistory";
import Landing from "./components/Landing";
import MainMenu from "./components/MainMenu";
import Lobby from "./components/Lobby";
import GameScreen from "./components/GameScreen";
import LanguageSwitcher from "./components/LanguageSwitcher";
import MatchHistory from "./components/MatchHistory";
import Replay from "./components/Replay";

export default function App() {
  // In cima all'albero: un cambio lingua deve far ri-renderizzare ogni
  // schermata che usa t(), non solo il selettore che l'ha attivato.
  useLocale();
  const sessionId = useMemo(() => getSessionId(), []);
  const [joinCode] = useState(() => parseJoinCodeFromUrl());
  const conn = useGameConnection(sessionId);
  const [showHistory, setShowHistory] = useState(false);
  const [replayEntry, setReplayEntry] = useState<MatchHistoryEntry | null>(null);

  function handleLandingSubmit(nickname: string) {
    if (joinCode) {
      conn.joinRoom(joinCode, nickname);
    } else {
      conn.goToMenu();
    }
  }

  let screen: React.ReactNode = null;
  switch (conn.screen) {
    case "landing":
      screen = <Landing joinCode={joinCode} reconnecting={conn.reconnecting} onSubmit={handleLandingSubmit} />;
      break;
    case "menu":
      screen = showHistory ? (
        <MatchHistory onBack={() => setShowHistory(false)} onReplay={(entry) => setReplayEntry(entry)} />
      ) : (
        <MainMenu
          onCreate={() => conn.createRoom(getSavedNickname())}
          onJoin={(code) => conn.joinRoom(code, getSavedNickname())}
          onHistory={() => setShowHistory(true)}
        />
      );
      break;
    case "lobby":
      screen = conn.roomState ? (
        <Lobby
          room={conn.roomState}
          sessionId={sessionId}
          onStart={conn.startGame}
          onSelectMap={conn.selectMap}
          onSetRules={conn.setRules}
          onKick={conn.kickPlayer}
          onLeave={conn.leaveRoom}
          chatMessages={conn.chatMessages}
          onSendChatMessage={conn.sendChatMessage}
        />
      ) : null;
      break;
    case "game":
      screen = conn.gameState ? (
        <GameScreen
          gameState={conn.gameState}
          sessionId={sessionId}
          turnDeadline={conn.turnDeadline}
          events={conn.events}
          diceRoll={conn.diceRoll}
          moveBatch={conn.moveBatch}
          onIntent={conn.sendIntent}
          onLeave={conn.leaveRoom}
          chatMessages={conn.chatMessages}
          onSendChatMessage={conn.sendChatMessage}
          onRematch={conn.rematch}
          isHost={conn.roomState?.players.find((p) => p.sessionId === sessionId)?.isHost ?? false}
        />
      ) : null;
      break;
  }

  if (replayEntry) {
    return <Replay entry={replayEntry} onExit={() => setReplayEntry(null)} />;
  }

  return (
    <>
      {conn.screen !== "game" && <LanguageSwitcher />}
      {conn.error && (
        <button type="button" className="error-toast" onClick={conn.dismissError}>
          {conn.error}
        </button>
      )}
      {screen}
    </>
  );
}
