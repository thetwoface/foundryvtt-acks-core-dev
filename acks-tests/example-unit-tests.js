export function exampleUnitTests(context) {
  const { describe, it, assert, expect, should } = context;

  describe('Example Unit Tests', () => {
    it("Passing Test", function () {
      assert.ok(true);
    });
    it("Failing Test", function () {
      assert.ok(false);
    });
    it("Passing Test using expect", function () {
      expect(2).to.equal(2);
    });
    it("Failing Test using expect", function () {
      expect(2).to.equal(undefined);
    });
    it("Passing Test using should", function () {
      const foo = { bar: "baz" };
      foo.should.have.property("bar", "baz");
    });
    it("Failing Test using should", function () {
      const foo = { bar: "baz" };
      foo.should.have.property("bar", "qux");
    });
    it("Passing Test using should helper", function () {
      should.not.equal(1, 2);
    });
    it("Failing Test using should helper", function () {
      should.equal(1, 2);
    });
  });
}
