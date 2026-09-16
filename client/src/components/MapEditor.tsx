import { useRef, useState } from "react";
import type { BoardConfig, Tile as TileData, TileType } from "@morichup/shared";
import { coordFor, cornerTypeAt, perimeterCount, validateBoard } from "@morichup/shared";
import { t } from "../i18n";
import Tile from "./Tile";

interface MapEditorProps {
  onExit: () => void;
}

const MIN_SIZE = 8;
const MAX_SIZE = 15;
const DEFAULT_WIDTH = 11;
const DEFAULT_HEIGHT = 9;
const CORNER_TYPES = new Set(["start", "jail", "freeParking", "goToJail"]);

/** Tipi realmente gestiti dal GameEngine (vedi resolveLanding): l'editor non offre gli
 * altri membri di TileType, che non hanno ancora una logica di gioco associata. */
const EDITABLE_TYPES: TileType[] = ["property", "railroad", "utility", "chance", "communityChest", "incomeTax", "luxuryTax"];

const GROUP_COLOR_PALETTE = ["#8b5a2b", "#7ec8e3", "#e91e8c", "#fdd835", "#f5821f", "#e53935", "#2e7d32", "#1a237e"];

const CORNER_NAME: Record<string, string> = {
  start: "Go",
  jail: "Jail / Just Visiting",
  freeParking: "Free Parking",
  goToJail: "Go To Jail",
};

function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `custom-${Date.now()}`;
}

function blankTileAt(index: number, width: number, height: number): TileData {
  const position = coordFor(index, width, height);
  const corner = cornerTypeAt(index, width, height);
  if (corner) {
    return { id: `tile-${index}`, type: corner, name: CORNER_NAME[corner], position };
  }
  return { id: `tile-${index}`, type: "chance", name: t("editor.type.chance"), position };
}

function generateBlankTiles(width: number, height: number): TileData[] {
  return Array.from({ length: perimeterCount(width, height) }, (_, i) => blankTileAt(i, width, height));
}

/**
 * Fase 9, US-901/US-902: editor visuale per creare una mappa da zero. Riusa lo stesso
 * componente `Tile` del tabellone di gioco (solo con `onClick`, non collegato a una
 * partita reale) così l'anteprima è identica a come apparirà davvero in-game.
 */
export default function MapEditor({ onExit }: MapEditorProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [name, setName] = useState(t("editor.defaultName"));
  const [tiles, setTiles] = useState<TileData[]>(() => generateBlankTiles(DEFAULT_WIDTH, DEFAULT_HEIGHT));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTile = selectedIndex !== null ? tiles[selectedIndex] : null;

  function regenerate(nextWidth: number, nextHeight: number) {
    if (!window.confirm(t("editor.regenerateConfirm"))) return;
    setWidth(nextWidth);
    setHeight(nextHeight);
    setTiles(generateBlankTiles(nextWidth, nextHeight));
    setSelectedIndex(null);
    setErrors([]);
  }

  function updateSelectedTile(patch: Partial<TileData>) {
    if (selectedIndex === null) return;
    setTiles((prev) => prev.map((tile, i) => (i === selectedIndex ? ({ ...tile, ...patch } as TileData) : tile)));
  }

  function changeSelectedType(newType: TileType) {
    if (selectedIndex === null) return;
    const base = { id: tiles[selectedIndex].id, position: tiles[selectedIndex].position, name: tiles[selectedIndex].name };
    let next: TileData;
    if (newType === "property") {
      next = { ...base, type: "property", group: "", groupColor: GROUP_COLOR_PALETTE[0], purchasePrice: 100, baseRent: 10 };
    } else if (newType === "railroad" || newType === "utility") {
      next = { ...base, type: newType, purchasePrice: 150 };
    } else if (newType === "incomeTax" || newType === "luxuryTax") {
      next = { ...base, type: newType, amount: 100 };
    } else {
      next = { ...base, type: newType };
    }
    setTiles((prev) => prev.map((tile, i) => (i === selectedIndex ? next : tile)));
  }

  function buildBoard(): BoardConfig {
    return {
      id: slugify(name),
      name: name.trim() || t("editor.defaultName"),
      version: "0.1.0",
      width,
      height,
      tiles,
      rules: {
        startingMoney: 1500,
        passingStartBonus: 200,
        minPlayers: 2,
        maxPlayers: 8,
        auctionOnDecline: false,
        turnTimerSeconds: "off",
      },
    };
  }

  function handleExport() {
    const board = buildBoard();
    const result = validateBoard(board);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${board.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as BoardConfig;
        const result = validateBoard(parsed);
        if (!result.valid) {
          setErrors(result.errors);
          return;
        }
        setName(parsed.name);
        setWidth(parsed.width);
        setHeight(parsed.height);
        setTiles(parsed.tiles);
        setSelectedIndex(null);
        setErrors([]);
      } catch {
        setErrors([t("editor.importParseError")]);
      }
    };
    reader.readAsText(file);
  }

  const aspectRatio = width / height;

  return (
    <div className="app-layout">
      <header className="app-topbar">
        <span className="app-topbar__title">{t("editor.title")}</span>
        <div className="app-topbar__actions">
          <button type="button" className="btn btn--ghost btn--small" onClick={onExit}>
            {t("menu.back")}
          </button>
        </div>
      </header>
      <div className="app-main">
        <div className="app-board-area">
          <div
            className="board"
            style={{
              gridTemplateColumns: `repeat(${width}, 1fr)`,
              gridTemplateRows: `repeat(${height}, 1fr)`,
              aspectRatio: `${width} / ${height}`,
              width: `min(90vw, calc(78vh * ${aspectRatio}))`,
            }}
          >
            {tiles.map((tile, i) => (
              <Tile
                key={tile.id}
                tile={tile}
                isCorner={CORNER_TYPES.has(tile.type)}
                isHighlighted={selectedIndex === i}
                onClick={CORNER_TYPES.has(tile.type) ? undefined : () => setSelectedIndex(i)}
              />
            ))}
          </div>
        </div>
        <aside className="game-side-panel map-editor__panel">
          <div className="action-panel">
            <label className="field-label" htmlFor="editor-name">
              {t("editor.boardName")}
            </label>
            <input
              id="editor-name"
              className="text-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />

            <div className="map-editor__size-row">
              <label className="field-label" htmlFor="editor-width">
                {t("editor.width")}
              </label>
              <select
                id="editor-width"
                className="text-input"
                value={width}
                onChange={(e) => regenerate(Number(e.target.value), height)}
              >
                {Array.from({ length: MAX_SIZE - MIN_SIZE + 1 }, (_, i) => MIN_SIZE + i).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <label className="field-label" htmlFor="editor-height">
                {t("editor.height")}
              </label>
              <select
                id="editor-height"
                className="text-input"
                value={height}
                onChange={(e) => regenerate(width, Number(e.target.value))}
              >
                {Array.from({ length: MAX_SIZE - MIN_SIZE + 1 }, (_, i) => MIN_SIZE + i).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {selectedTile && !CORNER_TYPES.has(selectedTile.type) ? (
              <div className="map-editor__tile-form">
                <h3 className="section-label">{t("editor.editingTile")}</h3>
                <label className="field-label" htmlFor="tile-name">
                  {t("editor.tileName")}
                </label>
                <input
                  id="tile-name"
                  className="text-input"
                  value={selectedTile.name}
                  onChange={(e) => updateSelectedTile({ name: e.target.value })}
                  maxLength={30}
                />

                <label className="field-label" htmlFor="tile-type">
                  {t("editor.tileType")}
                </label>
                <select
                  id="tile-type"
                  className="text-input"
                  value={selectedTile.type}
                  onChange={(e) => changeSelectedType(e.target.value as TileType)}
                >
                  {EDITABLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`editor.type.${type}`)}
                    </option>
                  ))}
                </select>

                {selectedTile.type === "property" && (
                  <>
                    <label className="field-label" htmlFor="tile-group">
                      {t("editor.group")}
                    </label>
                    <input
                      id="tile-group"
                      className="text-input"
                      value={selectedTile.group ?? ""}
                      onChange={(e) => updateSelectedTile({ group: e.target.value })}
                      placeholder={t("editor.groupPlaceholder")}
                      maxLength={20}
                    />
                    <span className="field-label">{t("editor.groupColor")}</span>
                    <div className="color-picker">
                      {GROUP_COLOR_PALETTE.map((swatch) => (
                        <button
                          key={swatch}
                          type="button"
                          className={`color-picker__swatch${selectedTile.groupColor === swatch ? " color-picker__swatch--selected" : ""}`}
                          style={{ backgroundColor: swatch }}
                          onClick={() => updateSelectedTile({ groupColor: swatch })}
                          aria-label={swatch}
                        />
                      ))}
                    </div>
                    <label className="field-label" htmlFor="tile-rent">
                      {t("editor.baseRent")}
                    </label>
                    <input
                      id="tile-rent"
                      type="number"
                      min={0}
                      className="text-input"
                      value={selectedTile.baseRent ?? 0}
                      onChange={(e) => updateSelectedTile({ baseRent: Number(e.target.value) })}
                    />
                  </>
                )}

                {(selectedTile.type === "property" || selectedTile.type === "railroad" || selectedTile.type === "utility") && (
                  <>
                    <label className="field-label" htmlFor="tile-price">
                      {t("editor.purchasePrice")}
                    </label>
                    <input
                      id="tile-price"
                      type="number"
                      min={1}
                      className="text-input"
                      value={selectedTile.purchasePrice ?? 0}
                      onChange={(e) => updateSelectedTile({ purchasePrice: Number(e.target.value) })}
                    />
                  </>
                )}

                {(selectedTile.type === "incomeTax" || selectedTile.type === "luxuryTax") && (
                  <>
                    <label className="field-label" htmlFor="tile-amount">
                      {t("editor.amount")}
                    </label>
                    <input
                      id="tile-amount"
                      type="number"
                      min={1}
                      className="text-input"
                      value={selectedTile.amount ?? 0}
                      onChange={(e) => updateSelectedTile({ amount: Number(e.target.value) })}
                    />
                  </>
                )}
              </div>
            ) : (
              <p className="waiting-notice">{t("editor.selectTilePrompt")}</p>
            )}

            {errors.length > 0 && (
              <ul className="map-editor__errors">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}

            <div className="button-row">
              <button type="button" className="btn btn--ghost" onClick={() => fileInputRef.current?.click()}>
                {t("editor.import")}
              </button>
              <button type="button" className="btn btn--primary" onClick={handleExport}>
                {t("editor.export")}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="map-editor__file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
