// Chess piece silhouettes: Colin M.L. Burnett ("Cburnett"), from Wikimedia Commons.
// Licence: CC BY-SA 3.0 (tri-licence GFDL/BSD/GPL). The star in none.svg is our own drawing.
import type { Piece } from "../game/types";
import pawn from "./pieces/Chess_pdt45.svg";
import knight from "./pieces/Chess_ndt45.svg";
import bishop from "./pieces/Chess_bdt45.svg";
import rook from "./pieces/Chess_rdt45.svg";
import queen from "./pieces/Chess_qdt45.svg";
import king from "./pieces/Chess_kdt45.svg";
import none from "./pieces/none.svg";

const sources: Record<Piece, string> = { pawn, knight, bishop, rook, queen, king, none };

/** A black silhouette for the piece. It is decoration: the card name gives the meaning. */
export function PieceIcon({ piece, className }: { piece: Piece; className?: string }) {
  return <img className={className} src={sources[piece]} alt="" aria-hidden="true" />;
}
