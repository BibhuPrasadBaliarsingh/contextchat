require("dotenv").config();

const {
  generateEmbedding,
} = require("./services/embeddingService");

const test = async () => {
  const embedding =
    await generateEmbedding(
      "The project deadline is Friday."
    );

  if (!embedding) {
    console.log(
      "Embedding generation failed."
    );

    return;
  }

  console.log(
    "Embedding generated successfully."
  );

  console.log(
    "Dimensions:",
    embedding.length
  );

  console.log(
    "First values:",
    embedding.slice(0, 5)
  );
};

test();