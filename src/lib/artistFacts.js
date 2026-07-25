async function searchWikipediaTitle(lang, query) {
  var url =
    'https://' + lang + '.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
    encodeURIComponent(query) + '&format=json&origin=*&srlimit=1'
  try {
    var res = await fetch(url)
    var data = await res.json()
    if (data.query && data.query.search && data.query.search.length > 0) {
      return data.query.search[0].title
    }
  } catch (err) {}
  return null
}

async function fetchWikipediaExtract(lang, title) {
  var url =
    'https://' + lang + '.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=' +
    encodeURIComponent(title) + '&format=json&origin=*'
  try {
    var res = await fetch(url)
    var data = await res.json()
    var pages = data.query && data.query.pages
    if (!pages) return null
    var pageId = Object.keys(pages)[0]
    if (pageId === '-1') return null
    return pages[pageId] && pages[pageId].extract ? pages[pageId].extract : null
  } catch (err) {
    return null
  }
}

function splitFacts(text) {
  if (!text) return []
  var cleaned = text.replace(/\n+/g, ' ')
  var parts = cleaned.split(/(?<=\.)\s+/)
  var facts = []
  var i = 0
  while (i < parts.length && facts.length < 4) {
    var p = parts[i].trim()
    if (p.length > 25 && p.length < 200 && !/^\d/.test(p)) {
      facts.push(p)
    }
    i = i + 1
  }
  return facts
}

export async function fetchArtistFacts(artistName) {
  var esTitle = await searchWikipediaTitle('es', artistName)
  var extract = esTitle ? await fetchWikipediaExtract('es', esTitle) : null
  var facts = splitFacts(extract)

  if (facts.length < 3) {
    var enTitle = await searchWikipediaTitle('en', artistName)
    var enExtract = enTitle ? await fetchWikipediaExtract('en', enTitle) : null
    var enFacts = splitFacts(enExtract)
    if (enFacts.length > facts.length) {
      facts = enFacts
    }
  }

  return facts
}
