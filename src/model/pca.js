import { FEATURES } from "../config/modelConfig";

function dot(a, b) {
  return a.reduce(
    (sum, value, index) =>
      sum + value * b[index],
    0
  );
}

function magnitude(vector) {
  return Math.sqrt(
    dot(vector, vector)
  );
}

function normalize(vector) {
  const length =
    magnitude(vector) || 1;

  return vector.map(
    (value) => value / length
  );
}

function multiplyMatrixVector(
  matrix,
  vector
) {
  return matrix.map(
    (row) => dot(row, vector)
  );
}

function powerIteration(
  matrix,
  iterations = 120
) {
  const size =
    matrix.length;

  let vector =
    normalize(
      Array.from(
        { length: size },
        (_, index) =>
          1 +
          (index % 3) *
            0.07
      )
    );

  for (
    let step = 0;
    step < iterations;
    step += 1
  ) {
    const next =
      multiplyMatrixVector(
        matrix,
        vector
      );

    if (
      magnitude(next) === 0
    ) {
      break;
    }

    vector =
      normalize(next);
  }

  const transformed =
    multiplyMatrixVector(
      matrix,
      vector
    );

  const eigenvalue =
    dot(
      vector,
      transformed
    );

  return {
    eigenvalue,
    vector,
  };
}

function deflate(
  matrix,
  eigenvalue,
  vector
) {
  return matrix.map(
    (row, rowIndex) =>
      row.map(
        (value, columnIndex) =>
          value -
          eigenvalue *
            vector[rowIndex] *
            vector[columnIndex]
      )
  );
}

function orientComponent(
  vector
) {
  let strongestIndex = 0;

  for (
    let index = 1;
    index < vector.length;
    index += 1
  ) {
    if (
      Math.abs(
        vector[index]
      ) >
      Math.abs(
        vector[strongestIndex]
      )
    ) {
      strongestIndex = index;
    }
  }

  if (
    vector[strongestIndex] <
    0
  ) {
    return vector.map(
      (value) => -value
    );
  }

  return vector;
}

function covarianceMatrix(
  matrix
) {
  if (!matrix.length) {
    return [];
  }

  const features =
    matrix[0].length;

  const denominator =
    Math.max(
      1,
      matrix.length - 1
    );

  return Array.from(
    { length: features },
    (_, rowIndex) =>
      Array.from(
        {
          length: features,
        },
        (_, columnIndex) =>
          matrix.reduce(
            (sum, row) =>
              sum +
              row[rowIndex] *
                row[columnIndex],
            0
          ) / denominator
      )
  );
}

function trace(matrix) {
  return matrix.reduce(
    (sum, row, index) =>
      sum + row[index],
    0
  );
}

function standardizePlayers(
  players,
  weights
) {
  const means = {};
  const stds = {};

  for (
    const feature of FEATURES
  ) {
    const values =
      players.map(
        (player) =>
          Number(
            player[
              feature.key
            ] ?? 0
          )
      );

    const mean =
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      Math.max(
        1,
        values.length
      );

    const variance =
      values.reduce(
        (sum, value) =>
          sum +
          (value - mean) ** 2,
        0
      ) /
      Math.max(
        1,
        values.length
      );

    means[feature.key] =
      mean;

    stds[feature.key] =
      Math.sqrt(
        variance
      ) || 1;
  }

  const matrix =
    players.map(
      (player) =>
        FEATURES.map(
          (feature) => {
            const z =
              (Number(
                player[
                  feature.key
                ] ?? 0
              ) -
                means[
                  feature.key
                ]) /
              stds[
                feature.key
              ];

            return (
              z *
              Math.sqrt(
                weights[
                  feature.key
                ] ?? 1
              )
            );
          }
        )
    );

  return {
    matrix,
    means,
    stds,
  };
}

function topLoadings(
  vector,
  count = 3
) {
  return FEATURES.map(
    (feature, index) => ({
      key: feature.key,
      label:
        feature.longLabel,
      shortLabel:
        feature.label,
      loading:
        vector[index],
      abs:
        Math.abs(
          vector[index]
        ),
    })
  )
    .sort(
      (a, b) =>
        b.abs - a.abs
    )
    .slice(0, count);
}

function axisDescription(
  loadings
) {
  if (!loadings.length) {
    return "mixed statistical profile";
  }

  const positive =
    loadings.filter(
      (item) =>
        item.loading > 0
    );

  const negative =
    loadings.filter(
      (item) =>
        item.loading < 0
    );

  const positiveText =
    positive
      .map(
        (item) =>
          item.label.toLowerCase()
      )
      .join(", ");

  const negativeText =
    negative
      .map(
        (item) =>
          item.label.toLowerCase()
      )
      .join(", ");

  if (
    positiveText &&
    negativeText
  ) {
    return `higher ${positiveText} versus lower ${negativeText}`;
  }

  if (positiveText) {
    return `higher ${positiveText}`;
  }

  return `lower ${negativeText}`;
}

export function runPCA(
  players,
  weights
) {
  if (
    !players?.length ||
    players.length < 2
  ) {
    return null;
  }

  const { matrix } =
    standardizePlayers(
      players,
      weights
    );

  const covariance =
    covarianceMatrix(
      matrix
    );

  const totalVariance =
    trace(covariance);

  const first =
    powerIteration(
      covariance
    );

  const firstVector =
    orientComponent(
      first.vector
    );

  const covarianceAfterFirst =
    deflate(
      covariance,
      first.eigenvalue,
      firstVector
    );

  const second =
    powerIteration(
      covarianceAfterFirst
    );

  let secondVector =
    orientComponent(
      second.vector
    );

  // Re-orthogonalize the second axis against the first axis.
  const projection =
    dot(
      secondVector,
      firstVector
    );

  secondVector =
    normalize(
      secondVector.map(
        (value, index) =>
          value -
          projection *
            firstVector[index]
      )
    );

  const points =
    players.map(
      (player, index) => ({
        player,
        x: dot(
          matrix[index],
          firstVector
        ),
        y: dot(
          matrix[index],
          secondVector
        ),
      })
    );

  const firstLoadings =
    topLoadings(
      firstVector
    );

  const secondLoadings =
    topLoadings(
      secondVector
    );

  const firstExplained =
    totalVariance
      ? Math.max(
          0,
          first.eigenvalue
        ) /
        totalVariance *
        100
      : 0;

  const secondExplained =
    totalVariance
      ? Math.max(
          0,
          second.eigenvalue
        ) /
        totalVariance *
        100
      : 0;

  return {
    points,

    axis1: {
      vector:
        firstVector,
      loadings:
        firstLoadings,
      explained:
        firstExplained,
      description:
        axisDescription(
          firstLoadings
        ),
    },

    axis2: {
      vector:
        secondVector,
      loadings:
        secondLoadings,
      explained:
        secondExplained,
      description:
        axisDescription(
          secondLoadings
        ),
    },

    explainedTotal:
      firstExplained +
      secondExplained,
  };
}

export function nearestOnMap(
  pca,
  playerId,
  count = 5
) {
  if (!pca) {
    return [];
  }

  const origin =
    pca.points.find(
      (point) =>
        point.player.id ===
        playerId
    );

  if (!origin) {
    return [];
  }

  return pca.points
    .filter(
      (point) =>
        point.player.id !==
        playerId
    )
    .map(
      (point) => ({
        ...point,
        distance:
          Math.sqrt(
            (point.x -
              origin.x) **
              2 +
              (point.y -
                origin.y) **
                2
          ),
      })
    )
    .sort(
      (a, b) =>
        a.distance -
        b.distance
    )
    .slice(0, count);
}
