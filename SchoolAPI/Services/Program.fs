module HelloSquare

let square x = x * x

[<EntryPoint>]
let main argv =
    printfn "The square of 5 is %d" (square 5)
    0 // return an integer exit code