import { render, screen, fireEvent } from "@testing-library/react";
import Lobby from "../Lobby";
import { makeRoomState } from "../../test/fixtures";

describe("Lobby", () => {
  const noop = () => {};

  it("l'host vede il pulsante di avvio abilitato quando ci sono abbastanza giocatori connessi", () => {
    const room = makeRoomState({
      players: [
        { sessionId: "p1", nickname: "Yasser", isHost: true, connected: true, isSpectator: false },
        { sessionId: "p2", nickname: "Dany", isHost: false, connected: true, isSpectator: false },
      ],
    });
    render(
      <Lobby
        room={room}
        sessionId="p1"
        onStart={noop}
        onSelectMap={noop}
        onLoadCustomMap={noop}
        onSetRules={noop}
        onKick={noop}
        onLeave={noop}
        chatMessages={[]}
        onSendChatMessage={noop}
      />
    );

    expect(screen.getByRole("button", { name: /start game/i })).toBeEnabled();
  });

  it("l'host vede il pulsante di avvio disabilitato senza abbastanza giocatori connessi", () => {
    const room = makeRoomState({
      minPlayers: 2,
      players: [{ sessionId: "p1", nickname: "Yasser", isHost: true, connected: true, isSpectator: false }],
    });
    render(
      <Lobby
        room={room}
        sessionId="p1"
        onStart={noop}
        onSelectMap={noop}
        onLoadCustomMap={noop}
        onSetRules={noop}
        onKick={noop}
        onLeave={noop}
        chatMessages={[]}
        onSendChatMessage={noop}
      />
    );

    expect(screen.getByRole("button", { name: /waiting for at least/i })).toBeDisabled();
  });

  it("chi non è host non vede il pulsante di avvio, solo l'attesa", () => {
    const room = makeRoomState({
      players: [
        { sessionId: "p1", nickname: "Yasser", isHost: true, connected: true, isSpectator: false },
        { sessionId: "p2", nickname: "Dany", isHost: false, connected: true, isSpectator: false },
      ],
    });
    render(
      <Lobby
        room={room}
        sessionId="p2"
        onStart={noop}
        onSelectMap={noop}
        onLoadCustomMap={noop}
        onSetRules={noop}
        onKick={noop}
        onLeave={noop}
        chatMessages={[]}
        onSendChatMessage={noop}
      />
    );

    expect(screen.queryByRole("button", { name: /start game/i })).toBeNull();
    expect(screen.getByText(/waiting for the host/i)).toBeInTheDocument();
  });

  it("solo l'host può scegliere la mappa", () => {
    const room = makeRoomState({
      players: [
        { sessionId: "p1", nickname: "Yasser", isHost: true, connected: true, isSpectator: false },
        { sessionId: "p2", nickname: "Dany", isHost: false, connected: true, isSpectator: false },
      ],
    });
    const onSelectMap = vi.fn();
    const { rerender } = render(
      <Lobby
        room={room}
        sessionId="p2"
        onStart={noop}
        onSelectMap={onSelectMap}
        onLoadCustomMap={noop}
        onSetRules={noop}
        onKick={noop}
        onLeave={noop}
        chatMessages={[]}
        onSendChatMessage={noop}
      />
    );
    const nonHostMapButtons = screen.getAllByRole("button", { name: /Classic|Extended|Fortune|Quick/ });
    expect(nonHostMapButtons.every((btn) => (btn as HTMLButtonElement).disabled)).toBe(true);

    rerender(
      <Lobby
        room={room}
        sessionId="p1"
        onStart={noop}
        onSelectMap={onSelectMap}
        onLoadCustomMap={noop}
        onSetRules={noop}
        onKick={noop}
        onLeave={noop}
        chatMessages={[]}
        onSendChatMessage={noop}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Extended/ }));
    expect(onSelectMap).toHaveBeenCalledWith("extended");
  });

  it("mostra il lucchetto solo se la stanza richiede una password", () => {
    const room = makeRoomState({ hasPassword: true });
    const { container, rerender } = render(
      <Lobby
        room={room}
        sessionId="p1"
        onStart={noop}
        onSelectMap={noop}
        onLoadCustomMap={noop}
        onSetRules={noop}
        onKick={noop}
        onLeave={noop}
        chatMessages={[]}
        onSendChatMessage={noop}
      />
    );
    expect(container.querySelector(".room-code-box__lock")).not.toBeNull();

    rerender(
      <Lobby
        room={makeRoomState({ hasPassword: false })}
        sessionId="p1"
        onStart={noop}
        onSelectMap={noop}
        onLoadCustomMap={noop}
        onSetRules={noop}
        onKick={noop}
        onLeave={noop}
        chatMessages={[]}
        onSendChatMessage={noop}
      />
    );
    expect(container.querySelector(".room-code-box__lock")).toBeNull();
  });
});
