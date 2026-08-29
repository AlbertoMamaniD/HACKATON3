import { z } from "zod";
import { readStored, writeStored } from "../utils/storage";

describe("persistencia segura", () => {
  const schema = z.object({ value: z.number() });
  it("persiste y recupera configuración", () => { writeStored("test", { value: 42 }); expect(readStored("test", schema, { value: 1 })).toEqual({ value: 42 }); });
  it("restaura el valor seguro si localStorage está corrupto", () => { localStorage.setItem("test", "{no-es-json"); expect(readStored("test", schema, { value: 1 })).toEqual({ value: 1 }); expect(localStorage.getItem("test")).toBeNull(); });
  it("restaura si los datos no cumplen el esquema", () => { localStorage.setItem("test", JSON.stringify({ value: "incorrecto" })); expect(readStored("test", schema, { value: 3 })).toEqual({ value: 3 }); });
});
