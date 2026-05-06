import pt from "../client/src/locales/pt.json" with { type: "json" };

function translate(key, languageData) {
  const keys = key.split(".");
  let value = languageData;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return null;
    }
  }
  return value;
}

console.log("Testing home.board.col_origin:", translate("home.board.col_origin", pt));
console.log("Testing flight.book:", translate("flight.book", pt));
console.log("Testing search.origin:", translate("search.origin", pt));
