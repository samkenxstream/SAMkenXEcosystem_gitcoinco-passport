import React from "react";
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { BrightidCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { brightidStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFUL_BRIGHTID_RESULT } from "../../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@dpopp/identity/dist/commonjs";

jest.mock("@dpopp/identity/dist/commonjs", () => ({
  fetchVerifiableCredential: jest.fn(),
}));
jest.mock("../../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const handleAddStamp = jest.fn();
const mockUserContext: UserContextState = {
  userDid: undefined,
  loggedIn: true,
  passport: undefined,
  isLoadingPassport: false,
  allProvidersState: {
    Brightid: {
      providerSpec: STAMP_PROVIDERS.Brightid,
      stamp: undefined,
    },
  },
  handleAddStamp: handleAddStamp,
  handleCreatePassport: mockCreatePassport,
  handleConnection: mockHandleConnection,
  address: mockAddress,
  wallet: mockWallet,
  signer: undefined,
  walletLabel: mockWallet.label,
};

describe("when user has not verfied with BrightId Provider", () => {
  it("should display a verify button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <BrightidCard />
      </UserContext.Provider>
    );

    const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

    expect(initialVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with BrightId Provider", () => {
  it("should display that a verified credential was returned", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Brightid: {
              providerSpec: STAMP_PROVIDERS.Ens,
              stamp: brightidStampFixture,
            },
          },
        }}
      >
        <BrightidCard />
      </UserContext.Provider>
    );

    const ensVerified = screen.queryByText(/Verified/);

    expect(ensVerified).toBeInTheDocument();
  });
});

describe("when the verify button is clicked", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("and when a successful BrightId result is returned", () => {
    beforeEach(() => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_BRIGHTID_RESULT);
    });

    it("the modal displays the verify button", async () => {});

    it("clicking verify adds the stamp", async () => {});

    it("clicking cancel closes the modal and a stamp should not be added", async () => {});
  });

  describe("and when a failed Bright Id result is returned", () => {
    it("modal displays a failed message", async () => {
      (fetchVerifiableCredential as jest.Mock).mockRejectedValue("ERROR");
      render(
        <UserContext.Provider value={mockUserContext}>
          <BrightidCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

      fireEvent.click(initialVerifyButton!);

      const verifyModal = await screen.findByRole("dialog");
      const verifyModalText = screen.getByText("Your address does not have an ENS domain associated");

      expect(verifyModal).toBeInTheDocument();

      await waitFor(() => {
        expect(verifyModalText).toBeInTheDocument();
      });
    });
  });
});
