import { QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

const connectors = [injected()];

if (projectId) {
  connectors.push(
    walletConnect({
      projectId,
      metadata: {
        name: "Avaxopoly",
        description: "Single-player Avaxopoly MVP",
        url: "https://avaxopoly.local",
        icons: []
      }
    })
  );
}

export const wagmiConfig = createConfig({
  chains: [avalancheFuji],
  connectors,
  transports: {
    [avalancheFuji.id]: http()
  }
});

export const queryClient = new QueryClient();

