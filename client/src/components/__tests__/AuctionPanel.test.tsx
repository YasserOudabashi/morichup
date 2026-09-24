import { render, screen, fireEvent } from "@testing-library/react";
import AuctionPanel from "../AuctionPanel";
import { makeBoard, makePlayer, makeTile } from "../../test/fixtures";
import type { AuctionState } from "@morichup/shared";

describe("AuctionPanel", () => {
  const tile = makeTile({ id: "t1", name: "Paris" });
  const board = makeBoard([tile]);
  const players = [makePlayer({ sessionId: "p1", nickname: "Yasser", money: 1000 }), makePlayer({ sessionId: "p2", nickname: "Dany" })];

  function makeAuction(overrides: Partial<AuctionState> = {}): AuctionState {
    return {
      tileId: "t1",
      currentBid: 100,
      currentBidderId: null,
      eligibleBidderIds: ["p1", "p2"],
      deadline: Date.now() + 20000,
      sellerId: null,
      minimumBid: 100,
      ...overrides,
    };
  }

  it("asta libera: chiunque sia ancora eleggibile vede i bottoni di rilancio, non solo 'chi è di turno'", () => {
    const onIntent = vi.fn();
    render(<AuctionPanel auction={makeAuction()} board={board} players={players} sessionId="p1" onIntent={onIntent} />);

    expect(screen.getByRole("button", { name: "+$2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+$10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+$100" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pass/i })).toBeInTheDocument();
  });

  it("chi ha già passato vede solo lo stato, senza controlli di offerta", () => {
    render(
      <AuctionPanel
        auction={makeAuction({ eligibleBidderIds: ["p1"] })}
        board={board}
        players={players}
        sessionId="p2"
        onIntent={() => {}}
      />
    );

    expect(screen.queryByRole("button", { name: "+$2" })).toBeNull();
    expect(screen.queryByRole("button", { name: /pass/i })).toBeNull();
  });

  it("un click su +$10 invia PLACE_BID col prezzo attuale più 10", () => {
    const onIntent = vi.fn();
    render(<AuctionPanel auction={makeAuction({ currentBid: 100 })} board={board} players={players} sessionId="p1" onIntent={onIntent} />);

    fireEvent.click(screen.getByRole("button", { name: "+$10" }));
    expect(onIntent).toHaveBeenCalledWith({ type: "PLACE_BID", amount: 110 });
  });

  it("invia PASS_AUCTION quando si clicca Pass", () => {
    const onIntent = vi.fn();
    render(<AuctionPanel auction={makeAuction()} board={board} players={players} sessionId="p1" onIntent={onIntent} />);

    fireEvent.click(screen.getByRole("button", { name: /pass/i }));
    expect(onIntent).toHaveBeenCalledWith({ type: "PASS_AUCTION" });
  });

  it("disabilita i bottoni di rilancio che il giocatore non può permettersi", () => {
    render(
      <AuctionPanel
        auction={makeAuction({ currentBid: 995 })}
        board={board}
        players={players}
        sessionId="p1"
        onIntent={() => {}}
      />
    );

    // p1 ha $1000: +$2 (=997) e +$10 (=1005, no) -> solo +$10 e +$100 superano i fondi.
    expect(screen.getByRole("button", { name: "+$2" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "+$10" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "+$100" })).toBeDisabled();
  });
});
