const request = require("supertest");
const app = require("../app");

describe("GET /documentation.json", () => {
  it("should return 200 OK", async () => {
    return request(app)
      .get("/documentation.json")
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.swagger).toBe("2.0");
      });
  });
});
