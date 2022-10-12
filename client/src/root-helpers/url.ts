function getParamToggle (params: URLSearchParams, name: string, defaultValue?: boolean) {
  return params.has(name)
    ? (params.get(name) === '1' || params.get(name) === 'true')
    : defaultValue
}

function getParamString (params: URLSearchParams, name: string, defaultValue?: string) {
  return params.has(name)
    ? params.get(name)
    : defaultValue
}

function objectToUrlEncoded (obj: any) {
  const str: string[] = []
  for (const key of Object.keys(obj)) {
    str.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
  }

  return str.join('&')
}

function addQueryParams (url: string, params: { [ id: string ]: string }) {
  const objUrl = new URL(url)

  for (const key of Object.keys(params)) {
    objUrl.searchParams.append(key, params[key])
  }

  return objUrl.toString()
}

export {
  getParamToggle,
  addQueryParams,
  getParamString,
  objectToUrlEncoded
}
