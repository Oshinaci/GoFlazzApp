import { NotificationsService } from "./notifications.service";

export interface NFTAttribute {
  traitType: string;
  value: string;
  rarityPercent?: number;
}

export interface NFTItem {
  id: string;
  tokenId: string;
  name: string;
  collectionName: string;
  contractAddress: string;
  network: "Ethereum" | "Arbitrum" | "Polygon" | "Base";
  imageUrl: string;
  description: string;
  floorPriceEth: number;
  floorPriceUsd: number;
  rarityRank?: number;
  totalInCollection?: number;
  attributes: NFTAttribute[];
  ownerAddress: string;
  acquiredDate: string;
}

export const MOCK_NFTS: NFTItem[] = [
  {
    id: "nft-1",
    tokenId: "8412",
    name: "Pudgy Penguin #8412",
    collectionName: "Pudgy Penguins",
    contractAddress: "0xBd3531dA5CF5857e7CfAA92426877b022e612cf8",
    network: "Ethereum",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    description: "A cute, quirky penguin residing on the Ethereum blockchain. Pudgy Penguins represent empathy, positive vibes, and Web3 innovation.",
    floorPriceEth: 11.85,
    floorPriceUsd: 39697.5,
    rarityRank: 420,
    totalInCollection: 8888,
    attributes: [
      { traitType: "Background", value: "Cyber Mint", rarityPercent: 8.2 },
      { traitType: "Skin", value: "Normal", rarityPercent: 45.0 },
      { traitType: "Face", value: "Cute Glasses", rarityPercent: 5.1 },
      { traitType: "Body", value: "Kimono", rarityPercent: 2.8 },
    ],
    ownerAddress: "0x71C...39A2",
    acquiredDate: "2024-03-12",
  },
  {
    id: "nft-2",
    tokenId: "1924",
    name: "Azuki #1924",
    collectionName: "Azuki",
    contractAddress: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
    network: "Ethereum",
    imageUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80",
    description: "Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden: a corner of the internet where artists, builders, and web3 enthusiasts meet.",
    floorPriceEth: 4.92,
    floorPriceUsd: 16482.0,
    rarityRank: 1250,
    totalInCollection: 10000,
    attributes: [
      { traitType: "Hair", value: "Silver Katana Ponytail", rarityPercent: 3.2 },
      { traitType: "Eyes", value: "Fire Glow", rarityPercent: 6.4 },
      { traitType: "Clothing", value: "Red Haori", rarityPercent: 4.1 },
    ],
    ownerAddress: "0x71C...39A2",
    acquiredDate: "2024-05-01",
  },
  {
    id: "nft-3",
    tokenId: "3890",
    name: "Arbitrum Odyssey Beacon #3890",
    collectionName: "Arbitrum Odyssey",
    contractAddress: "0xfa90123456789abcdef123456789abcdef123456",
    network: "Arbitrum",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80",
    description: "Commemorative NFT badge awarded to early liquidity providers and dApp explorers during Arbitrum Odyssey.",
    floorPriceEth: 0.18,
    floorPriceUsd: 603.0,
    rarityRank: 88,
    totalInCollection: 5000,
    attributes: [
      { traitType: "Tier", value: "Legendary", rarityPercent: 1.5 },
      { traitType: "Element", value: "Arbitrum Blue Plasma", rarityPercent: 7.0 },
    ],
    ownerAddress: "0x71C...39A2",
    acquiredDate: "2024-01-18",
  },
  {
    id: "nft-4",
    tokenId: "5510",
    name: "Milady Maker #5510",
    collectionName: "Milady Maker",
    contractAddress: "0x5Af0D9827E0c53E4799BB226655A1de152A425a5",
    network: "Ethereum",
    imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop&q=80",
    description: "Milady Maker is a collection of 10,000 generative pfp NFTs inspired by Japanese street fashion aesthetics.",
    floorPriceEth: 3.15,
    floorPriceUsd: 10552.5,
    rarityRank: 812,
    totalInCollection: 10000,
    attributes: [
      { traitType: "Drip Score", value: "88", rarityPercent: 12.0 },
      { traitType: "Hat", value: "Beret", rarityPercent: 9.5 },
    ],
    ownerAddress: "0x71C...39A2",
    acquiredDate: "2024-02-22",
  },
];

export class NFTService {
  static getNFTs(): NFTItem[] {
    return MOCK_NFTS;
  }

  static getNFTById(id: string): NFTItem | undefined {
    return MOCK_NFTS.find((item) => item.id === id);
  }

  static async transferNFT(
    nftId: string,
    recipientAddress: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const nft = NFTService.getNFTById(nftId);
        const randomHex = Math.random().toString(16).substring(2, 10);
        const txHash = `0x${randomHex}${Math.random().toString(16).substring(2, 34)}`;

        if (nft) {
          NotificationsService.addNotification(
            "transaction",
            `Transferred ${nft.name}`,
            `Sent to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)} (Tx: ${txHash.slice(0, 8)}...)`,
            "/activity"
          );
        }

        resolve({
          success: true,
          txHash,
        });
      }, 1500);
    });
  }
}
