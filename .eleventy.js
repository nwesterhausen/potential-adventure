module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('./src/img');
  // eleventyConfig.addMarkdownHighlighter((str, language) => {
  //   if (language === "mermaid") {
  //     return `<pre class="mermaid">${str}</pre>`;
  //   }
  //   return highlighter(str, language);
  // });
  
  return {
    dir: {
      input: 'src',
      output: 'public'
    }
  }
}