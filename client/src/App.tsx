import { useMemo, useState } from "react";
import { getSavedNickname, getSessionId } from "./lib/session";
import { parseJoinCodeFromUrl } from "./lib/url";
import { useGameConnection } from "./state/useGameConnection";
import { useLocale } from "./i18n";
import Landing from "./components/Landing";
import MainMenu from "./components/MainMenu";
import Lobby from "./components/Lobby";
import GameScreen from "./components/GameScreen";
import LanguageSwitcher from "./components/LanguageSwitcher";

export default function App() {
  // In cima all'albero: un cambio lingua deve far ri-renderizzare ogni
  // schermata che usa t(), non solo il selettore che l'ha attivato.
  useLocale();
  const sessionId = useMemo(() => getSessionId(), []);
  const [joinCode] = useState(() => parseJoinCodeFromUrl());
  const conn = useGameConnection(sessionId);

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
      screen = (
        <MainMenu
          onCreate={(password) => conn.createRoom(getSavedNickname(), password)}
          onJoin={(code, password) => conn.joinRoom(code, getSavedNickname(), password)}
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
