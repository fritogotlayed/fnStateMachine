const chai = require('chai');
const sinon = require('sinon');
const uuid = require('uuid');
const got = require('got');

const globals = require('../globals');
const enums = require('../enums');
const repos = require('../repos');
const Task = require('./task');


describe('operations', () => {
  const definition = {
    Type: 'Task',
    Resource: 'http://test.local/invoke/some-method',
  };

  beforeEach(() => {
    this.sandbox = sinon.createSandbox();
    this.sandbox.stub(globals, 'logger');
  });

  afterEach(() => {
    this.sandbox.restore();
  });

  describe('task', () => {
    it('Should throw exception when definition Type is not Task', () => {
      // Arrange
      const metadata = {
        id: 'operationId',
        execution: 'executionId',
      };

      // Act
      try {
        Task.call({}, { Type: 'Succeed' }, metadata);
      } catch (err) {
        chai.expect(err.message).to.be.equal('Attempted to use Succeed type for "Task".');
      }
    });

    it('Should throw exception when invoke returns non 200.', () => {
      // Arrange
      definition.Next = { Type: 'Succeed' };
      const metadata = {
        id: 'operationId',
        execution: 'executionId',
      };
      const op = new Task(definition, metadata);
      const updateOperationStub = this.sandbox.stub(repos, 'updateOperation').resolves();
      const createOperationStub = this.sandbox.stub(repos, 'createOperation').resolves();
      const postStub = this.sandbox.stub(got, 'post').resolves({ statusCode: 404, body: 'not found' });
      this.sandbox.stub(uuid, 'v4').returns('nextOpId');

      // Act
      return op.run().catch((err) => {
        // Assert
        chai.expect(postStub.getCalls().length).to.be.equal(1);
        chai.expect(postStub.getCall(0).args).to.be.eql([
          definition.Resource,
          {
            body: undefined,
            headers: {
              'content-type': 'application/json',
            },
          },
        ]);
        chai.expect(updateOperationStub.getCalls().length).to.be.equal(1);
        chai.expect(createOperationStub.getCalls().length).to.be.equal(0);
        chai.expect(updateOperationStub.getCall(0).args).to.be.eql(['operationId', enums.OP_STATUS.Executing]);
        chai.expect(err.message).to.be.eql('not found');
      });
    });

    describe('Should succeed operation and create next operation', () => {
      it('when input is undefined', () => {
        // Arrange
        definition.Next = { Type: 'Succeed' };
        const metadata = {
          id: 'operationId',
          execution: 'executionId',
        };
        const op = new Task(definition, metadata);
        const updateOperationStub = this.sandbox.stub(repos, 'updateOperation').resolves();
        const createOperationStub = this.sandbox.stub(repos, 'createOperation').resolves();
        const expectedOutput = { test: 'data' };
        const postStub = this.sandbox.stub(got, 'post').resolves({ statusCode: 200, body: JSON.stringify(expectedOutput) });
        this.sandbox.stub(uuid, 'v4').returns('nextOpId');

        // Act
        return op.run().then((thenResult) => {
          // Assert
          chai.expect(postStub.getCalls().length).to.be.equal(1);
          chai.expect(postStub.getCall(0).args).to.be.eql([
            definition.Resource,
            {
              body: undefined,
              headers: {
                'content-type': 'application/json',
              },
            },
          ]);
          chai.expect(updateOperationStub.getCalls().length).to.be.equal(2);
          chai.expect(createOperationStub.getCalls().length).to.be.equal(1);
          chai.expect(updateOperationStub.getCall(0).args).to.be.eql(['operationId', enums.OP_STATUS.Executing]);
          chai.expect(updateOperationStub.getCall(1).args).to.be.eql(['operationId', enums.OP_STATUS.Succeeded, expectedOutput]);
          chai.expect(createOperationStub.getCall(0).args).to.be.eql(['nextOpId', 'executionId', definition.Next, expectedOutput]);
          chai.expect(thenResult).to.be.eql({
            next: definition.Next,
            nextOpId: 'nextOpId',
            output: expectedOutput,
          });
        });
      });

      it('when input is null', () => {
        // Arrange
        definition.Next = { Type: 'Succeed' };
        const metadata = {
          id: 'operationId',
          execution: 'executionId',
          input: null,
        };
        const op = new Task(definition, metadata);
        const updateOperationStub = this.sandbox.stub(repos, 'updateOperation').resolves();
        const createOperationStub = this.sandbox.stub(repos, 'createOperation').resolves();
        const expectedOutput = { test: 'data' };
        const postStub = this.sandbox.stub(got, 'post').resolves({ statusCode: 200, body: JSON.stringify(expectedOutput) });
        this.sandbox.stub(uuid, 'v4').returns('nextOpId');

        // Act
        return op.run().then((thenResult) => {
          // Assert
          chai.expect(postStub.getCalls().length).to.be.equal(1);
          chai.expect(postStub.getCall(0).args).to.be.eql([
            definition.Resource,
            {
              body: null,
              headers: {
                'content-type': 'application/json',
              },
            },
          ]);
          chai.expect(updateOperationStub.getCalls().length).to.be.equal(2);
          chai.expect(createOperationStub.getCalls().length).to.be.equal(1);
          chai.expect(updateOperationStub.getCall(0).args).to.be.eql(['operationId', enums.OP_STATUS.Executing]);
          chai.expect(updateOperationStub.getCall(1).args).to.be.eql(['operationId', enums.OP_STATUS.Succeeded, expectedOutput]);
          chai.expect(createOperationStub.getCall(0).args).to.be.eql(['nextOpId', 'executionId', definition.Next, expectedOutput]);
          chai.expect(thenResult).to.be.eql({
            next: definition.Next,
            nextOpId: 'nextOpId',
            output: expectedOutput,
          });
        });
      });

      it('when input is a string', () => {
        // Arrange
        definition.Next = { Type: 'Succeed' };
        const metadata = {
          id: 'operationId',
          execution: 'executionId',
          input: 'abc',
        };
        const op = new Task(definition, metadata);
        const updateOperationStub = this.sandbox.stub(repos, 'updateOperation').resolves();
        const createOperationStub = this.sandbox.stub(repos, 'createOperation').resolves();
        const expectedOutput = { test: 'data' };
        const postStub = this.sandbox.stub(got, 'post').resolves({ statusCode: 200, body: JSON.stringify(expectedOutput) });
        this.sandbox.stub(uuid, 'v4').returns('nextOpId');

        // Act
        return op.run().then((thenResult) => {
          // Assert
          chai.expect(postStub.getCalls().length).to.be.equal(1);
          chai.expect(postStub.getCall(0).args).to.be.eql([
            definition.Resource,
            {
              body: 'abc',
              headers: {
                'content-type': 'application/json',
              },
            },
          ]);
          chai.expect(updateOperationStub.getCalls().length).to.be.equal(2);
          chai.expect(createOperationStub.getCalls().length).to.be.equal(1);
          chai.expect(updateOperationStub.getCall(0).args).to.be.eql(['operationId', enums.OP_STATUS.Executing]);
          chai.expect(updateOperationStub.getCall(1).args).to.be.eql(['operationId', enums.OP_STATUS.Succeeded, expectedOutput]);
          chai.expect(createOperationStub.getCall(0).args).to.be.eql(['nextOpId', 'executionId', definition.Next, expectedOutput]);
          chai.expect(thenResult).to.be.eql({
            next: definition.Next,
            nextOpId: 'nextOpId',
            output: expectedOutput,
          });
        });
      });

      it('when input is a object', () => {
        // Arrange
        definition.Next = { Type: 'Succeed' };
        const metadata = {
          id: 'operationId',
          execution: 'executionId',
          input: { testInput: 1234 },
        };
        const op = new Task(definition, metadata);
        const updateOperationStub = this.sandbox.stub(repos, 'updateOperation').resolves();
        const createOperationStub = this.sandbox.stub(repos, 'createOperation').resolves();
        const expectedOutput = { test: 'data' };
        const postStub = this.sandbox.stub(got, 'post').resolves({ statusCode: 200, body: JSON.stringify(expectedOutput) });
        this.sandbox.stub(uuid, 'v4').returns('nextOpId');

        // Act
        return op.run().then((thenResult) => {
          // Assert
          chai.expect(postStub.getCalls().length).to.be.equal(1);
          chai.expect(postStub.getCall(0).args).to.be.eql([
            definition.Resource,
            {
              body: '{"testInput":1234}',
              headers: {
                'content-type': 'application/json',
              },
            },
          ]);
          chai.expect(updateOperationStub.getCalls().length).to.be.equal(2);
          chai.expect(createOperationStub.getCalls().length).to.be.equal(1);
          chai.expect(updateOperationStub.getCall(0).args).to.be.eql(['operationId', enums.OP_STATUS.Executing]);
          chai.expect(updateOperationStub.getCall(1).args).to.be.eql(['operationId', enums.OP_STATUS.Succeeded, expectedOutput]);
          chai.expect(createOperationStub.getCall(0).args).to.be.eql(['nextOpId', 'executionId', definition.Next, expectedOutput]);
          chai.expect(thenResult).to.be.eql({
            next: definition.Next,
            nextOpId: 'nextOpId',
            output: expectedOutput,
          });
        });
      });
    });
  });
});
