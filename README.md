## kaskaid

Virtualized masonry layout for React, powered by [`@tanstack/virtual`](https://tanstack.com/virtual).

Only the items in and around the viewport are rendered, so masonry grids with thousands of items stay fast. SSR-ready, and works with either window scrolling or a custom scroll container.

```sh
pnpm add kaskaid @tanstack/react-virtual
```

```tsx
import { Masonry } from 'kaskaid';

<Masonry
  data={items}
  estimateSize={(i) => items[i].height}
  renderItem={({ item, index }) => <Card item={item} index={index} />}
/>;
```

[Documentation](https://kaskaid.vercel.app)

## License

MIT
