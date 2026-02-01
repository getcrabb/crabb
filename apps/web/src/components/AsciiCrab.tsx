'use client';

export function AsciiCrab() {
  const crab = `
    ___       ___
   /   \\     /   \\
  |     \\___/     |
  |  \\         /  |
   \\  \\_______/  /
    \\___________/
      ||| |||
`;

  return (
    <pre className="ascii text-center text-xs md:text-sm lg:text-base leading-none select-none glow-orange">
      {crab}
    </pre>
  );
}
