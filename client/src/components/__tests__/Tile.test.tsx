import { render, screen } from "@testing-library/react";
import Tile from "../Tile";
import { makeTile } from "../../test/fixtures";

describe("Tile", () => {
  it("mostra nome e prezzo di una proprietà libera", () => {
    render(<Tile tile={makeTile({ name: "Paris", purchasePrice: 320 })} isCorner={false} />);
    expect(screen.getByText("Paris")).toBeInTheDocument();
    expect(screen.getByText("$320")).toBeInTheDocument();
  });

  it("mostra la bandiera solo per le proprietà, non per le altre caselle", () => {
    const { container, rerender } = render(
      <Tile tile={makeTile({ type: "property", name: "Paris" })} isCorner={false} />
    );
    expect(container.querySelector(".board-tile__flag")).not.toBeNull();

    rerender(<Tile tile={makeTile({ type: "chance", name: "Fortune", purchasePrice: undefined })} isCorner={false} />);
    expect(container.querySelector(".board-tile__flag")).toBeNull();
  });

  it("mostra la barra del proprietario solo quando la casella è posseduta", () => {
    const { container, rerender } = render(<Tile tile={makeTile()} isCorner={false} />);
    expect(container.querySelector(".board-tile__owner-bar")).toBeNull();

    rerender(<Tile tile={makeTile({ ownerId: "p1" })} isCorner={false} ownerColor="#e91e8c" />);
    expect(container.querySelector(".board-tile__owner-bar")).not.toBeNull();
  });

  it("mostra una casa per ogni casa costruita, e l'hotel al posto delle case", () => {
    const { container, rerender } = render(<Tile tile={makeTile({ houses: 3 })} isCorner={false} />);
    expect(container.querySelectorAll(".board-tile__building-icon").length).toBe(3);

    rerender(<Tile tile={makeTile({ houses: 4, hotel: true })} isCorner={false} />);
    expect(container.querySelector(".board-tile__buildings--hotel")).not.toBeNull();
    expect(container.querySelectorAll(".board-tile__building-icon").length).toBe(1);
  });
});
