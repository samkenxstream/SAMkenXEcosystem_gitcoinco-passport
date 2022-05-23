import axios from "axios";

// --- Key tools
import { fromByteArray, toByteArray } from "base64-js";
import { sign } from "tweetnacl";
import { sign } from "@noble/ed25519";

export type BrightIdSponsorshipResponse = {
  status: number;
  data: {
    data?: {
      hash: boolean;
      app: string;
      context: string;
      contextIds: string[];
    };
  };
};

export type BrightIdSponsorshipInfoResponse = {
  status: number;
  data: {
    data?: {
      id: string;
      name: string;
      context: string;
      verification: string;
      logo: string;
      url: string;
      assignedSponsorships: number;
      unusedSponsorships: number;
      testing: boolean;
      soulbound: boolean;
    };
  };
};

export type BrightIdOptions = {
  name?: string;
  app?: string;
  contextId?: string;
  timestamp?: any;
  v?: number;
  sig?: string;
  [key: string]: any;
};

export type brightIdSponsorshipReturn = {
  status: string;
  statusReason: any;
};

// Triggers BrightID sponsorship if iam server does not return a valid verification
export const brightIdSponsorship = async (contextId: string): Promise<brightIdSponsorshipReturn> => {
  const context = "Gitcoin";
  const endpoint = "https://app.brightid.org/node/v5/operations";
  const sponsorships = await availableSponsorships(context);

  if (typeof sponsorships === "number" && sponsorships < 1) {
    return { status: "error", statusReason: "no available sponsorships" };
  }

  if (typeof sponsorships !== "number") return sponsorships;

  const options: BrightIdOptions = {
    name: "Sponsor",
    app: "Gitcoin",
    contextId: contextId,
    timestamp: Date.now(),
    v: 5,
  };

  const signing_key = sign(btoa(process.env.BRIGHTID_PRIVATE_KEY));
  const message = getMessage(options);
  const arrayedMessage = Buffer.from(message);
  const keyBuffer = toByteArray(process.env.BRIGHTID_PRIVATE_KEY);
  const signature = sign.detached(arrayedMessage, keyBuffer);
  options.sig = fromByteArray(signature);
  try {
    const res: any = await axios.post(endpoint, options);
    console.log("sponsorship response ", res);
    // if (!res.data.data.hash) {
    //   return { status: "fail", statusReason: res.data.data.hash };
    // }
    // return { status: "success", statusReason: res.data.data.hash };
  } catch (err: any) {
    console.log(err);
  }
};

// Change Object with key value to array of key values
const getMessage = (op: BrightIdOptions): string => {
  const signedOp: BrightIdOptions = {};
  for (const k in op) {
    if (["sig", "sig1", "sig2", "hash"].includes(k)) {
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    signedOp[k] = op[k];
  }
  return JSON.stringify(signedOp);
};

// Check if there are available sponsorships before submitting a request
const availableSponsorships = async (context: string): Promise<number | undefined> => {
  const endpoint = "https://app.brightid.org/node/v5/apps";
  try {
    const res: BrightIdSponsorshipInfoResponse = await axios.get(`${endpoint}/${context}`);
    console.log(res);
    return res.data.data.unusedSponsorships > 0 ? res.data.data.unusedSponsorships : undefined;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};
