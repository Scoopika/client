t:
	bun run test

b:
	bun run build

f:
	bun run test && bun run prettier && bun run build

s:
	bun run testserver

h:
	bun run httpserver

e:
	bun run e2e
