// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@dpopp/types";

import axios from "axios";

export type BrightIdVerificationResponse = {
  unique: boolean;
  app: string;
  context: string;
  contextIds: string[];
};

type data = {
  data?: BrightIdVerificationResponse;
};

// BrightId API call response
type Response = {
  status: number;
  data?: data;
};

// The app name registered with BrightId for the verification end point
const appName = "Gitcoin";

// Request a verifiable credential from brightid
export class BrightIdProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Brightid";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const did = payload.proofs?.did;

      const responseData = await verifyBrightId(did);
      const formattedData = responseData?.data.data;

      // Unique is true if the user obtained "Meets" verification by attending a connection party
      const valid: boolean = responseData.status === 200 && formattedData.unique === true;

      return {
        valid,
        record: valid
          ? {
              context: appName,
              contextId: formattedData.contextIds[0],
              meets: JSON.stringify(formattedData.unique),
            }
          : undefined,
      };
    } catch (e) {
      return { valid: false };
    }
  }
}

// Runs a an axios get call to a Brightid App endpoint
async function verifyBrightId(did: string): Promise<Response> {
  try {
    const response: Response = await axios.get(`https://app.brightid.org/node/v5/verifications/${appName}/${did}`, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (e) {
    console.log(JSON.stringify(e));
    return undefined;
  }
}
