# Server is running!
- completes the game
- hit save score => throws an error
`Error: D1_TYPE_ERROR: Type 'object' not supported for value '[object Object]'`

## But, the server is printing the scores:
```
fresh from query: {
  allScores: [
    {score 1},
    {score 2} // saved it twice since it errored and didn't prevent me

  ]
}
```

So seems like the db is saving the data and can fetch it to render on server,
but it's not getting to the client, and there's a DB error
