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
      turnOrder: ["p1", "p2"],
      turnIndex: 0,
      sellerId: null,
      minimumBid: 100,
      ...overrides,
    };
  }

  it("mostra i controlli di offerta solo a chi è di turno nell'asta", () => {
    const onIntent = vi.fn();
    render(<AuctionPanel auction={makeAuction()} board={board} players={players} sessionId="p1" onIntent={onIntent} />);

    expect(screen.getByRole("button", { name: /bid/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pass/i })).toBeInTheDocument();
  });

  it("chi non è di turno vede solo lo stato, senza controlli di offerta", () => {
    render(<AuctionPanel auction={makeAuction()} board={board} players={players} sessionId="p2" onIntent={() => {}} />);

    expect(screen.queryByRole("button", { name: /bid/i })).toBeNull();
    expect(screen.getByText(/Yasser/)).toBeInTheDocument();
  });

  it("invia PLACE_BID con l'importo inserito quando si clicca Bid", () => {
    const onIntent = vi.fn();
    render(<AuctionPanel auction={makeAuction({ currentBid: 100 })} board={board} players={players} sessionId="p1" onIntent={onIntent} />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: /bid/i }));

    expect(onIntent).toHaveBeenCalledWith({ type: "PLACE_BID", amount: 150 });
  });

  it("invia PASS_AUCTION quando si clicca Pass", () => {
    const onIntent = vi.fn();
    render(<AuctionPanel auction={makeAuction()} board={board} players={players} sessionId="p1" onIntent={onIntent} />);

    fireEvent.click(screen.getByRole("button", { name: /pass/i }));
    expect(onIntent).toHaveBeenCalledWith({ type: "PASS_AUCTION" });
  });

  it("disabilita il pulsante Bid se l'offerta non supera quella corrente", () => {
    render(<AuctionPanel auction={makeAuction({ currentBid: 100 })} board={board} players={players} sessionId="p1" onIntent={() => {}} />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "100" } });
    expect(screen.getByRole("button", { name: /bid/i })).toBeDisabled();
  });
});
