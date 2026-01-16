-- CreateTable
CREATE TABLE "btc_blocks" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "txCount" INTEGER NOT NULL,
    "size" INTEGER,
    "weight" INTEGER,
    "version" INTEGER,
    "merkleRoot" TEXT,
    "nonce" BIGINT,
    "difficulty" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "btc_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "btc_transactions" (
    "id" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "version" INTEGER,
    "size" INTEGER,
    "weight" INTEGER,
    "fee" BIGINT,
    "inputCount" INTEGER,
    "outputCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "btc_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eth_blocks" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "number" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "parentHash" TEXT NOT NULL,
    "miner" TEXT NOT NULL,
    "gasLimit" BIGINT NOT NULL,
    "gasUsed" BIGINT NOT NULL,
    "baseFeePerGas" BIGINT,
    "difficulty" BIGINT,
    "totalDifficulty" BIGINT,
    "size" INTEGER,
    "txCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eth_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eth_transactions" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT,
    "value" TEXT NOT NULL,
    "gas" BIGINT NOT NULL,
    "gasPrice" BIGINT,
    "maxFeePerGas" BIGINT,
    "maxPriorityFeePerGas" BIGINT,
    "nonce" INTEGER NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "input" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eth_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "btc_blocks_hash_key" ON "btc_blocks"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "btc_blocks_height_key" ON "btc_blocks"("height");

-- CreateIndex
CREATE INDEX "btc_blocks_height_idx" ON "btc_blocks"("height");

-- CreateIndex
CREATE INDEX "btc_blocks_timestamp_idx" ON "btc_blocks"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "btc_transactions_txid_key" ON "btc_transactions"("txid");

-- CreateIndex
CREATE INDEX "btc_transactions_txid_idx" ON "btc_transactions"("txid");

-- CreateIndex
CREATE INDEX "btc_transactions_blockId_idx" ON "btc_transactions"("blockId");

-- CreateIndex
CREATE UNIQUE INDEX "eth_blocks_hash_key" ON "eth_blocks"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "eth_blocks_number_key" ON "eth_blocks"("number");

-- CreateIndex
CREATE INDEX "eth_blocks_number_idx" ON "eth_blocks"("number");

-- CreateIndex
CREATE INDEX "eth_blocks_timestamp_idx" ON "eth_blocks"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "eth_transactions_hash_key" ON "eth_transactions"("hash");

-- CreateIndex
CREATE INDEX "eth_transactions_hash_idx" ON "eth_transactions"("hash");

-- CreateIndex
CREATE INDEX "eth_transactions_blockId_idx" ON "eth_transactions"("blockId");

-- CreateIndex
CREATE INDEX "eth_transactions_fromAddress_idx" ON "eth_transactions"("fromAddress");

-- CreateIndex
CREATE INDEX "eth_transactions_toAddress_idx" ON "eth_transactions"("toAddress");

-- AddForeignKey
ALTER TABLE "btc_transactions" ADD CONSTRAINT "btc_transactions_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "btc_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eth_transactions" ADD CONSTRAINT "eth_transactions_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "eth_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
