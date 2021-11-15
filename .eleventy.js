module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("./src/img");
  // eleventyConfig.addMarkdownHighlighter((str, language) => {
  //   if (language === "mermaid") {
  //     return `<pre class="mermaid">${str}</pre>`;
  //   }
  //   return highlighter(str, language);
  // });

  eleventyConfig.addLiquidFilter("dfDateStrFmt", stringFormatDfIsoDate);
  eleventyConfig.addLiquidFilter("vukcasfikodArrivals", vukcasfikodArrivals);

  return {
    dir: {
      input: "src",
      output: "public"
    }
  };
};

function vukcasfikodArrivals(value) {
  if (value.toISOString) {
    value = value.toISOString().split('T')[0];
  }
  switch(value) {
  case "0700-01-15":
    return "Embark";
  case "0700-05-13": 
    return "1st Migration Wave";
  case "0700-09-02": 
    return "2nd Migration Wave";
  default:
    console.log(`switch(${value}) matches default?`);
    return value;
  }
}

function stringFormatDfIsoDate(value) {
  const MONTH = [
    "Granite",
    "Slate",
    "Felsite",
    "Hematite",
    "Malachite",
    "Galena",
    "Limestone",
    "Sandstone",
    "Timber",
    "Moonstone",
    "Opal",
    "Obsidian"
  ];
  /// YYYY - MM - DD
  let darr = value.split("-");
  let day = parseInt(darr[2]);
  switch (day) {
    case 1:
    case 21:
      darr[2] = `${day}st`;
      break;
    case 2:
    case 22:
      darr[2] = `${day}nd`;
      break;
    case 3:
    case 23:
      darr[2] = `${day}rd`;
      break;
    default:
      darr[2] = `${day}th`;
  }
  return `${darr[2]} of ${MONTH[parseInt(darr[1]) - 1]} in the year ${parseInt(
    darr[0]
  )}`;
}
