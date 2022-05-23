// --- React Methods
import React, { useContext, useState } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity/dist/commonjs";

// --- pull context
import { UserContext } from "../../context/userContext";

// --- Secret tools
import QRCode from "react-qr-code";

// --- import components
import { Card } from "../Card";
import { VerifyModal } from "../VerifyModal";
import { useDisclosure, Button, useToast } from "@chakra-ui/react";

import { PROVIDER_ID, Stamp } from "@dpopp/types";
import { ProviderSpec } from "../../config/providers";

const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";

const providerId: PROVIDER_ID = "Brightid";

type BrightidResponse = {
  context: string;
  contextId: string;
  meet: boolean;
};

export default function EnsCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState, userDid } = useContext(UserContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [credentialResponse, SetCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const [brightIdVerification, SetBrightIdVerification] = useState<BrightidResponse | undefined>(undefined);
  const toast = useToast();

  const handleFetchCredential = (): void => {
    setCredentialResponseIsLoading(true);
    fetchVerifiableCredential(
      iamUrl,
      {
        type: "Brightid",
        version: "0.0.0",
        address: address || "",
        proofs: {
          did: userDid || "",
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then((verified: { record: any; credential: any }): void => {
        console.log("check verified ", verified);
        SetBrightIdVerification(verified.record);
        SetCredentialResponse({
          provider: "Brightid",
          credential: verified.credential,
        });
      })
      .catch((e: any): void => {})
      .finally((): void => {
        setCredentialResponseIsLoading(false);
      });
  };

  async function handleSponsorship(): Promise<void> {
    setCredentialResponseIsLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_DPOPP_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/sponsor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contextId: address,
      }),
    });
    const data = await res.json();
    if (data) {
      toast({
        title: "Success",
        description: "Successfully triggered BrightID Sponsorship. Come back to Passport to Verify.",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Failure",
        description: "Failed to trigger BrightID Sponsorship",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    setCredentialResponseIsLoading(false);
  }

  const handleUserVerify = (): void => {
    if (credentialResponse) {
      handleAddStamp(credentialResponse);
    }
    onClose();
  };

  // Widget displays steps to verify BrightID with Gitcoin
  const brightIdSponsorshipWidget = (
    <div>
      <h1 className="text-center font-bold underline">BrightID</h1>
      <br />
      <h1>A verifiable credential was not genereated for your address. Follow the steps below to qualify:</h1>
      <br />
      <div>
        <p>
          1) Download the BrightID App on your mobile device{" "}
          <a className="text-purple-400 underline" href="https://brightid.gitbook.io/brightid/getting-started">
            Get Started
          </a>
          .
        </p>
        <br />
        <div>
          2) Connect BrightID to Gitcoin by scanning this QR code from the BrightID app, or clicking{" "}
          <a
            className="text-purple-400 underline"
            href={`https://app.brightid.org/link-verification/http:%2f%2fnode.brightid.org/Gitcoin/${userDid}`}
          >
            here
          </a>{" "}
          from your mobile device.
          <br />
          <br />
          <div style={{ height: "auto", margin: "auto", maxWidth: 300, width: "100%" }}>
            <QRCode
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={`brightid://link-verification/http:%2f%2fnode.brightid.org/Gitcoin/${userDid}`}
            />
          </div>
        </div>

        <Button
          data-testid="button-passport-json-done"
          width={"auto"}
          rounded={"base"}
          colorScheme="purple"
          mr={3}
          float="right"
          onClick={async () => await handleSponsorship()}
        >
          <span className="font-miriam-libre">Connect BrightID</span>
        </Button>
      </div>
    </div>
  );

  const issueCredentialWidget = (
    <>
      <button
        data-testid="button-verify-brighid"
        className="verify-btn"
        onClick={() => {
          SetCredentialResponse(undefined);
          handleFetchCredential();
          onOpen();
        }}
      >
        Connect Account
      </button>
      <VerifyModal
        isOpen={isOpen}
        onClose={onClose}
        stamp={credentialResponse}
        handleUserVerify={handleUserVerify}
        verifyData={
          <>
            {brightIdVerification
              ? `Your BrightId has been verified on ${brightIdVerification.context}`
              : brightIdSponsorshipWidget}
          </>
        }
        isLoading={credentialResponseIsLoading}
      />
    </>
  );

  return (
    <Card
      providerSpec={allProvidersState[providerId]!.providerSpec as ProviderSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
    />
  );
}
