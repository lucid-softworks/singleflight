# `@lucid-softworks/singleflight`

Coalesces concurrent operations with the same key. Settled results are not
cached, so the next call starts fresh work.

```ts
import { Singleflight } from "@lucid-softworks/singleflight";

const flights = new Singleflight<string>();
const user = await flights.do("user:42", async () => ({
  id: 42,
  name: "Ada",
}));
```

`forget` and `clear` remove deduplication entries without cancelling work.
