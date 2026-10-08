import { describe, expect, it } from "vitest";
import { OrderStatus } from "../src/types";
import {
  cleanupGroups,
  createDiagnosticOrder,
  filterOrders,
  parseBulkOrdersText,
} from "../src/domain/orders";

describe("order domain behavior", () => {
  it("creates a pending diagnostic order with caller overrides", () => {
    const order = createDiagnosticOrder({ name: "CBC", category: "Lab" });

    expect(order).toMatchObject({
      name: "CBC",
      category: "Lab",
      status: OrderStatus.PENDING,
    });
    expect(order.id).toMatch(/^order_/);
  });

  it("filters orders by search, status, category, and encounter", () => {
    const orders = [
      createDiagnosticOrder({
        id: "cbc",
        name: "CBC",
        notes: "Morning draw",
        category: "Lab",
        encounterId: "encounter-1",
        status: OrderStatus.PENDING,
      }),
      createDiagnosticOrder({
        id: "xray",
        name: "Chest X-ray",
        category: "Imaging",
        encounterId: "encounter-2",
        status: OrderStatus.DONE,
      }),
    ];

    expect(
      filterOrders(orders, {
        searchQuery: "morning",
        statusFilter: OrderStatus.PENDING,
        typeFilter: "Lab",
        encounterFilter: "encounter-1",
      }).map((order) => order.id),
    ).toEqual(["cbc"]);
  });

  it("parses grouped bulk orders and removes singleton groups", () => {
    const orders = parseBulkOrdersText({
      inputText: "LAB\ncbc\n  cmp\n  electrolytes",
      defaultDate: "2026-08-26",
      defaultCategory: "Other",
      defaultStatus: OrderStatus.PENDING,
    });

    expect(orders).toHaveLength(3);
    expect(orders.every((order) => order.category === "Lab")).toBe(true);
    expect(orders.filter((order) => order.groupId)).toHaveLength(2);
  });

  it("keeps multi-item groups contiguous and dissolves singleton groups", () => {
    const cleaned = cleanupGroups([
      createDiagnosticOrder({ id: "a", groupId: "group-1" }),
      createDiagnosticOrder({ id: "singleton", groupId: "group-2" }),
      createDiagnosticOrder({ id: "b", groupId: "group-1" }),
    ]);

    expect(cleaned.map((order) => order.id)).toEqual(["a", "b", "singleton"]);
    expect(
      cleaned.find((order) => order.id === "singleton")?.groupId,
    ).toBeUndefined();
  });
});
