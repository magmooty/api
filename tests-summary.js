/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const fs = require("fs");
const {
  Message,
  Blocks,
  bold,
  codeInline,
  Elements,
  codeBlock,
} = require("slack-block-builder");
const { parse } = require("junit2json");
const slack = require("@slack/web-api");

const main = async () => {
  const jUnitData = fs.readFileSync(
    path.join(__dirname, "./reports/junit.xml").toString("utf-8")
  );

  const parsedJUnitData = await parse(jUnitData);

  const { tests, failures } = parsedJUnitData;

  const failedCollection = [];

  parsedJUnitData.testsuite.forEach((suite) => {
    suite.testcase.forEach((testCase) => {
      if (testCase.failure) {
        failedCollection.push(testCase.name.slice(suite.name.length + 1));
      }
    });
  });

  const isThereFailures = failures > 0;
  const resultEmoji = isThereFailures ? ":exclamation:" : ":white_check_mark:";

  const message = Message({ channel: "dev-integration-tests" })
    .text(
      `Integration tests finished recording ${failures} failures ${resultEmoji}`
    )
    .asUser()
    .blocks(
      Blocks.Section().text(bold(`Integration tests results ${resultEmoji}`)),
      Blocks.Section().text(
        [
          `Environment: ${codeInline(process.env.CIRCLE_BRANCH)}`,
          `Number of tests: ${tests}`,
          `Failed tests: ${failures}`,
          ...(isThereFailures ? [codeBlock(failedCollection.join("\n"))] : []),
        ].join("\n")
      ),
      Blocks.Actions().elements(
        isThereFailures
          ? Elements.Button()
              .text("View results")
              .url(process.env.CIRCLE_BUILD_URL)
              .actionId("view_results")
              .danger()
          : Elements.Button()
              .text("View results")
              .url(process.env.CIRCLE_BUILD_URL)
              .actionId("view_results")
              .primary()
      )
    )
    .buildToObject();

  const client = new slack.WebClient(process.env.SLACK_ACCESS_TOKEN);

  await client.chat.postMessage(message);
};

main();
