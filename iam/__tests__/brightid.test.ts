// --- Test subject
import { BrightIdVerificationResponse, BrightIdProvider } from "../src/providers/brightid";
import { RequestPayload } from "@dpopp/types";
import axios from "axios";

jest.mock("axios");

describe("Attempt Verification", () => {
  const did = "did:3:kjzl0cwe1jw1475ckc0ib6k44mm4sqegorxc1x23ppqh9lt9quso6yp7ayh2fae";
  const validResponse: BrightIdVerificationResponse = {
    unique: true,
    app: "Gitcoin",
    context: "Gitcoin",
    contextIds: [did],
  };

  let invalidResponse: BrightIdVerificationResponse = {
    unique: true,
    app: "Gitcoin",
    context: "Gitcoin",
    contextIds: [did],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    // Given we query BrightID with an appUserId
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          ...validResponse,
        },
      },
    });

    const result = await new BrightIdProvider().verify({
      did,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: true,
      record: {
        app: "Gitcoin",
        appUserId: did,
      },
    });
  });
  it("returns a not 200 response because user is not verified ", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 400,
      data: {
        data: {
          ...invalidResponse,
        },
      },
    });

    const result = await new BrightIdProvider().verify({
      did,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
    });
  });
  it("returns a unique false response because user did not enter a connection party", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          ...validResponse,
          unique: false,
        },
      },
    });

    const result = await new BrightIdProvider().verify({
      did,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      valid: false,
      record: undefined,
    });
  });
});
