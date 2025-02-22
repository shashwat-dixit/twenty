import { getSnapshotValue } from '@/ui/utilities/state/utils/getSnapshotValue';
import { workflowDiagramState } from '@/workflow/states/workflowDiagramState';
import { workflowLastCreatedStepIdState } from '@/workflow/states/workflowLastCreatedStepIdState';
import {
  WorkflowVersion,
  WorkflowWithCurrentVersion,
} from '@/workflow/types/Workflow';

import { addCreateStepNodes } from '@/workflow/utils/addCreateStepNodes';
import { getWorkflowVersionDiagram } from '@/workflow/utils/getWorkflowVersionDiagram';
import { mergeWorkflowDiagrams } from '@/workflow/utils/mergeWorkflowDiagrams';
import { useEffect } from 'react';
import { useRecoilCallback, useSetRecoilState } from 'recoil';
import { isDefined } from 'twenty-ui';

export const WorkflowDiagramEffect = ({
  workflowWithCurrentVersion,
}: {
  workflowWithCurrentVersion: WorkflowWithCurrentVersion | undefined;
}) => {
  const setWorkflowDiagram = useSetRecoilState(workflowDiagramState);

  const computeAndMergeNewWorkflowDiagram = useRecoilCallback(
    ({ snapshot, set }) => {
      return (currentVersion: WorkflowVersion) => {
        const previousWorkflowDiagram = getSnapshotValue(
          snapshot,
          workflowDiagramState,
        );

        const nextWorkflowDiagram = addCreateStepNodes(
          getWorkflowVersionDiagram(currentVersion),
        );

        let mergedWorkflowDiagram = nextWorkflowDiagram;
        if (isDefined(previousWorkflowDiagram)) {
          mergedWorkflowDiagram = mergeWorkflowDiagrams(
            previousWorkflowDiagram,
            nextWorkflowDiagram,
          );
        }

        const lastCreatedStepId = getSnapshotValue(
          snapshot,
          workflowLastCreatedStepIdState,
        );
        if (isDefined(lastCreatedStepId)) {
          mergedWorkflowDiagram.nodes = mergedWorkflowDiagram.nodes.map(
            (node) => {
              if (node.id === lastCreatedStepId) {
                return {
                  ...node,
                  selected: true,
                };
              }
              return node;
            },
          );

          set(workflowLastCreatedStepIdState, undefined);
        }

        set(workflowDiagramState, mergedWorkflowDiagram);
      };
    },
    [],
  );

  useEffect(() => {
    const currentVersion = workflowWithCurrentVersion?.currentVersion;
    if (!isDefined(currentVersion)) {
      setWorkflowDiagram(undefined);

      return;
    }

    computeAndMergeNewWorkflowDiagram(currentVersion);
  }, [
    computeAndMergeNewWorkflowDiagram,
    setWorkflowDiagram,
    workflowWithCurrentVersion?.currentVersion,
  ]);

  return null;
};
