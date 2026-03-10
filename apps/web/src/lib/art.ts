import aave from "../assets/aave.png";
import arena from "../assets/arena.jpg";
import avaxFoundation from "../assets/avax-foundation.jpg";
import avaxHasNoChill from "../assets/avax-has-no-chill.jpg";
import avaxL1 from "../assets/avax-l1.jpg";
import avery from "../assets/avery.jpeg";
import beam from "../assets/beam.jpg";
import bearsAndSalmons from "../assets/bears-and-salmons.jpg";
import benqi from "../assets/benqi.jpg";
import blackhole from "../assets/blackhole.jpg";
import blaze from "../assets/blaze.jpg";
import chainlink from "../assets/chainlink.jpg";
import coqInu from "../assets/coqinu.jpg";
import coreWallet from "../assets/core-wallet.jpg";
import dexalot from "../assets/dexalot.png";
import defiKingdom from "../assets/dfk.jpg";
import ferdy from "../assets/ferdy.jpg";
import giraffe from "../assets/giraffe.jpg";
import gmx from "../assets/GMX.jpg";
import justin from "../assets/justin.jpg";
import ket from "../assets/ket.jpg";
import lfj from "../assets/lfj.jpg";
import offTheGrid from "../assets/off-the-grid.jpg";
import pharaoh from "../assets/pharaoh.jpg";
import polypup from "../assets/polypup.jpg";
import salvor from "../assets/salvor.jpg";
import stupifff from "../assets/stupifff.jpg";
import twittTr from "../assets/twitt_tr.png";
import voh from "../assets/voh.jpg";
import wrathank from "../assets/wrathank.jpg";

const artByKey: Record<string, string> = {
  aavev3: aave,
  avery,
  "averysnoseclip": avery,
  "avaxfoundation": avaxFoundation,
  "avaxhasnochill": avaxHasNoChill,
  "avaxl1": avaxL1,
  beaml1: beam,
  "bearsandsalmons": bearsAndSalmons,
  bands: bearsAndSalmons,
  benqi,
  blackhole,
  blaze,
  chainlinkoracle: chainlink,
  coqinu: coqInu,
  "corewallet": coreWallet,
  dexalotl1: dexalot,
  dfk: defiKingdom,
  dfkchain: defiKingdom,
  "ferdyfish": ferdy,
  "giraffecomics": giraffe,
  gmx,
  "justnthephotog": justin,
  "justnthephotogthreatenstocutitoff": justin,
  lfj,
  "offthegrid": offTheGrid,
  pharaoh,
  "polypup1launchesanonchainexperiment": polypup,
  salvor,
  "stupifffsharesalpha": stupifff,
  "twitttrfudsyourproject": twittTr,
  twitttr: twittTr,
  voh,
  "yellowket": ket,
  "wrathanksgrift": wrathank
};

export const tokenIconBySymbol = {
  AVAX: avaxL1,
  COQ: coqInu,
  KET: ket,
  NOCHILL: avaxHasNoChill
} as const;

function normalize(value?: string) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function resolveArtwork(options: {
  tileName?: string;
  cardTitle?: string;
  momentId?: string;
  eventMessage?: string;
}) {
  const keys = [
    normalize(options.tileName),
    normalize(options.cardTitle),
    normalize(options.momentId),
    normalize(options.eventMessage)
  ];

  for (const key of keys) {
    if (key && artByKey[key]) {
      return artByKey[key];
    }
  }

  return undefined;
}
