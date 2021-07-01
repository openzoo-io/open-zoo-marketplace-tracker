require('dotenv').config()
const ethers = require('ethers')
const axios = require('axios')

const MarketplaceContractInfo = require('../constants/salescontractabi')

const provider = new ethers.providers.JsonRpcProvider(
  process.env.MAINNET_RPC,
  parseInt(process.env.MAINNET_CHAINID),
)

const loadMarketplaceContract = () => {
  let abi = MarketplaceContractInfo.abi
  let address = MarketplaceContractInfo.address
  let contract = new ethers.Contract(address, abi, provider)
  return contract
}

const marketplaceSC = loadMarketplaceContract()

const apiEndPoint = process.env.API_ENDPOINT

const toLowerCase = (val) => {
  if (val) return val.toLowerCase()
  else return val
}
const parseToFTM = (inWei) => {
  return parseFloat(inWei.toString()) / 10 ** 18
}
const convertTime = (value) => {
  return parseFloat(value) * 1000
}

const callAPI = async (endpoint, data) => {
  await axios({
    method: 'post',
    url: apiEndPoint + endpoint,
    data,
  })
}

const trackMarketPlace = () => {
  console.log('marketplace tracker has been started')

  //   item listed
  marketplaceSC.on(
    'ItemListed',
    async (
      owner,
      nft,
      tokenID,
      quantity,
      pricePerItem,
      startingTime,
      isPrivate,
      allowedAddress,
    ) => {
      owner = toLowerCase(owner)
      nft = toLowerCase(nft)
      tokenID = parseInt(tokenID)
      quantity = parseInt(quantity)
      pricePerItem = parseToFTM(pricePerItem)
      startingTime = convertTime(startingTime)
      await callAPI('itemListed', {
        owner,
        nft,
        tokenID,
        quantity,
        pricePerItem,
        startingTime,
      })
    },
  )

  //   item sold
  marketplaceSC.on(
    'ItemSold',
    async (seller, buyer, nft, tokenID, quantity, price) => {
      seller = toLowerCase(seller)
      buyer = toLowerCase(buyer)
      nft = toLowerCase(nft)
      tokenID = parseInt(tokenID)
      quantity = parseInt(quantity)
      price = parseToFTM(price)
      await callAPI('itemSold', {
        seller,
        buyer,
        nft,
        tokenID,
        quantity,
        price,
      })
    },
  )

  //   item updated

  marketplaceSC.on('ItemUpdated', async (owner, nft, tokenID, price) => {
    owner = toLowerCase(owner)
    nft = toLowerCase(nft)
    tokenID = parseInt(tokenID)
    price = parseToFTM(price)
    await callAPI('itemUpdated', { owner, nft, tokenID, price })
  })

  //   item cancelled
  marketplaceSC.on('ItemCanceled', async (owner, nft, tokenID) => {
    owner = toLowerCase(owner)
    nft = toLowerCase(nft)
    tokenID = parseInt(tokenID)
    await callAPI('itemCanceled', { owner, nft, tokenID })
  })

  // offer created
  marketplaceSC.on(
    'OfferCreated',
    async (
      creator,
      nft,
      tokenID,
      payToken,
      quantity,
      pricePerItem,
      deadline,
    ) => {
      creator = toLowerCase(creator)
      nft = toLowerCase(nft)
      tokenID = parseInt(tokenID)
      quantity = parseInt(quantity)
      pricePerItem = parseToFTM(pricePerItem)
      deadline = convertTime(deadline)
      await callAPI('offerCreated', {
        creator,
        nft,
        tokenID,
        quantity,
        pricePerItem,
        deadline,
      })
    },
  )

  // offer cancelled
  marketplaceSC.on('OfferCanceled', async (creator, nft, tokenID) => {
    creator = toLowerCase(creator)
    nft = toLowerCase(nft)
    tokenID = parseInt(tokenID)
    await callAPI('offerCanceled', { creator, nft, tokenID })
  })
}

module.exports = trackMarketPlace
