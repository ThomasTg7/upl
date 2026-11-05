// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { PostCover } from "./post-cover";

it("uses UPL artwork as the cover fallback without a broken image", () => {
  const { container } = render(<PostCover cover={null} sizes="100vw" />);
  expect(container.querySelector('[data-slot="post-cover-fallback"]')).toHaveTextContent("UPL");
  expect(container.querySelector("img")).toBeNull();
});
