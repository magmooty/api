import { config } from "@/components";
import { AssignerProtocol, Assignment, PartitionAssigner } from "kafkajs";

const { MemberMetadata, MemberAssignment } = AssignerProtocol;

/**
 * RoundRobinAssigner
 * @type {import('types').PartitionAssigner}
 */
export const LocalDevelopmentAssigner: PartitionAssigner = ({ cluster }) => ({
  name: "LocalDevelopmentAssigner",
  version: 1,
  async assign({ members, topics }) {
    console.log({ members, topics });
    const assignee = members
      .map(({ memberId }) => memberId)
      .find((memberId) =>
        memberId.includes(`${config.queue.config.groupId}-local`)
      );

    if (!assignee) {
      console.error("Cannot find local kafka member", { members, topics });
      process.exit();
    }

    const assignment: { [key: string]: Assignment } = {};

    const topicsPartitions = topics.flatMap((topic) => {
      const partitionMetadata = cluster.findTopicPartitionMetadata(topic);
      return partitionMetadata.map((m) => ({
        topic: topic,
        partitionId: m.partitionId,
      }));
    });

    topicsPartitions.forEach((topicPartition, i) => {
      if (!assignment[assignee]) {
        assignment[assignee] = Object.create(null);
      }

      if (!assignment[assignee][topicPartition.topic]) {
        assignment[assignee][topicPartition.topic] = [];
      }

      assignment[assignee][topicPartition.topic].push(
        topicPartition.partitionId
      );
    });

    console.debug(`\x1b[31mKAFKA CONNECTED TO ALL PARTITIONS ON ALL TOPICS\x1b[0m`);

    return Object.keys(assignment).map((memberId) => ({
      memberId,
      memberAssignment: MemberAssignment.encode({
        version: this.version,
        assignment: assignment[memberId],
      } as any),
    }));
  },
  protocol({ topics }) {
    console.log({ topics });
    return {
      name: this.name,
      metadata: MemberMetadata.encode({
        version: this.version,
        topics,
      } as any),
    };
  },
});
