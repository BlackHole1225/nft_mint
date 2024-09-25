
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createGenericFile, createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount, sol } from '@metaplex-foundation/umi';
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { mockStorage } from '@metaplex-foundation/umi-storage-mock';
import * as fs from 'fs';
import secret from './wallet.json';

const QUICKNODE_RPC = 'https://practical-cold-shard.solana-devnet.quiknode.pro/5ec27b3bf5cfa0ecd4e39d3f6af6a152198aea7c'; //Replace with your QuickNode RPC Endpoint
const umi = createUmi(QUICKNODE_RPC);
const clientId = "e4bf25023bdf97e6e26fb1939e9ae03d";
const storage = new ThirdwebStorage({ clientId });
const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
const creator = createSignerFromKeypair(umi, creatorWallet);
umi.use(keypairIdentity(creator));
umi.use(mplTokenMetadata());
umi.use(mockStorage());

const nftDetail = {
    name: "Foodstamp",
    symbol: "50$",
    uri: "IPFS_URL_OF_METADATA",
    royalties: 5.5,
    description: '20$',
    image:'https://quicknode.myfilebase.com/ipfs/QmfBxEvLt8iAEFWSkdABfo5RGf9uqJ2FBfV7GdPRCqoEZY/0/',
    imgType: 'image/png',
    attributes: [
        { trait_type: 'Speed', value: 'Quick' },
    ],
    properties: {
        files: [
            {
                type: "image/png",
                uri: "https://quicknode.myfilebase.com/ipfs/QmfBxEvLt8iAEFWSkdABfo5RGf9uqJ2FBfV7GdPRCqoEZY/0/"
            }
        ]
    },
};
async function uploadImage(): Promise<string> {
    try {
        const imgDirectory = './uploads';
        const imgName = 'Foodstamp.jpg'

        const filePath = `${imgDirectory}/${imgName}`;

        const fileBuffer = fs.readFileSync(filePath);

        console.log(fileBuffer);

        const image = createGenericFile(
            fileBuffer,
            imgName,
            {
                uniqueName: nftDetail.name,
                contentType: nftDetail.imgType
            }
        );
        const uri = await storage.upload(fileBuffer);
        console.log('image', uri);
        
        return uri;
    } catch (e) {
        throw e;
    }
}
async function uploadMetadata(imageUri: string): Promise<string> {
    try {
        const metadata = {
            name: nftDetail.name,
            description: nftDetail.description,
            image: imageUri,
            attributes: nftDetail.attributes,
            properties: {
                files: [
                    {
                        type: nftDetail.imgType,
                        uri: imageUri,
                    },
                ]
            }
        };
        // const metadataUri = await umi.uploader.uploadJson(metadata);
        const metadataUri = await storage.upload(metadata);
        console.log(metadataUri);
        return metadataUri;
    } catch (e) {
        throw e;
    }
}
async function mintNft(metadataUri: string) {
    try {
        const mint = generateSigner(umi);
        await createNft(umi, {
            mint,
            name: nftDetail.name,
            symbol: nftDetail.symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: percentAmount(nftDetail.royalties),
            creators: [{ address: creator.publicKey, verified: true, share: 100 }],
        }).sendAndConfirm(umi)
        console.log(`Created NFT: ${mint.publicKey.toString()}`)
    } catch (e) {
        throw e;
    }
}
async function main() {
        const imageUri = await uploadImage();
    const metadataUri = await uploadMetadata(imageUri);
    await mintNft(metadataUri);
}

main();