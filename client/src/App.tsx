import { useEffect, useMemo, useState } from "react";
import { getSavedColor, getSavedNickname, getSessionId } from "./lib/session";
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
import MapEditor from "./components/MapEditor";

export default function App() {
  // In cima all'albero: un cambio lingua deve far ri-renderizzare ogni
  // schermata che usa t(), non solo il selettore che l'ha attivato.
  useLocale();
  const sessionId = useMemo(() => getSessionId(), []);
  const [joinCode] = useState(() => parseJoinCodeFromUrl());
  const conn = useGameConnection(sessionId);
  const [showHistory, setShowHistory] = useState(false);
  const [replayEntry, setReplayEntry] = useState<MatchHistoryEntry | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // L'errore restava a schermo per sempre finché non lo si chiudeva a mano
  // (o si ricaricava la pagina): sparisce da solo dopo qualche secondo, e il
  // timer riparte da capo a ogni nuovo errore (dipendenza su conn.error).
  useEffect(() => {
    if (!conn.error) return;
    const timer = setTimeout(() => conn.dismissError(), 5000);
    return () => clearTimeout(timer);
  }, [conn.error, conn.dismissError]);

  function handleLandingSubmit(nickname: string) {
    if (joinCode) {
      conn.joinRoom(joinCode, nickname, getSavedColor() ?? undefined);
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
          onCreate={(password) => conn.createRoom(getSavedNickname(), getSavedColor() ?? undefined, password)}
          onJoin={(code, password) => conn.joinRoom(code, getSavedNickname(), getSavedColor() ?? undefined, password)}
          onHistory={() => setShowHistory(true)}
          onOpenEditor={() => setShowEditor(true)}
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
          onLoadCustomMap={conn.setCustomMap}
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

  if (showEditor) {
    return <MapEditor onExit={() => setShowEditor(false)} />;
  }

  return (
    <>
      {conn.screen !== "game" && <LanguageSwitcher />}
      {conn.error && (
        <button type="button" className="error-toast" onClick={conn.dismissError}>
          {conn.error}
        </button>
      )}
      {/* key sul route corrente: forza il remount così ogni cambio schermata
          rigioca la sua animazione di ingresso invece di restare statico. */}
      <div className="app-screen" key={conn.screen}>
        {screen}
      </div>
    </>
  );
}
