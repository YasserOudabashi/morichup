import { render, screen, fireEvent } from "@testing-library/react";
import DebtPanel from "../DebtPanel";
import { makeBoard, makePlayer, makeTile } from "../../test/fixtures";

describe("DebtPanel", () => {
  const tile = makeTile({ id: "t1", name: "Paris", purchasePrice: 300 });
  const board = makeBoard([tile]);

  it("mostra il debito totale e una casella in vendita per ogni proprietà posseduta", () => {
    const player = makePlayer({ properties: ["t1"], pendingDebts: [{ amount: 80, payeeId: null }] });
    render(<DebtPanel player={player} board={board} onIntent={() => {}} />);

    expect(screen.getByText(/80/)).toBeInTheDocument();
    // Metà del prezzo d'acquisto (300 / 2 = 150), come calcola il pannello.
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  it("invia SELL_PROPERTY_TO_BANK con l'id della casella cliccata", () => {
    const player = makePlayer({ properties: ["t1"], pendingDebts: [{ amount: 80, payeeId: null }] });
    const onIntent = vi.fn();
    render(<DebtPanel player={player} board={board} onIntent={onIntent} />);

    fireEvent.click(screen.getByRole("button", { name: /Paris/ }));
    expect(onIntent).toHaveBeenCalledWith({ type: "SELL_PROPERTY_TO_BANK", tileId: "t1" });
  });

  it("senza proprietà mostra solo l'avviso e il pulsante di bancarotta", () => {
    const player = makePlayer({ properties: [], pendingDebts: [{ amount: 50, payeeId: null }] });
    render(<DebtPanel player={player} board={board} onIntent={() => {}} />);

    expect(screen.queryByRole("button", { name: /Paris/ })).toBeNull();
    expect(screen.getByRole("button", { name: /bankruptcy/i })).toBeInTheDocument();
  });

  it("chiede conferma prima di dichiarare bancarotta, e non invia l'intent se l'utente annulla", () => {
    const player = makePlayer({ pendingDebts: [{ amount: 50, payeeId: null }] });
    const onIntent = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DebtPanel player={player} board={board} onIntent={onIntent} />);

    fireEvent.click(screen.getByRole("button", { name: /bankruptcy/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(onIntent).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
