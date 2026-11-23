# Network architecture

This diagram describes the logical AWS network tiers for TeamPulse. Compare it with the VPC and service configuration in your deployed AWS account; the local Compose environment does not create or change AWS resources.

```mermaid
flowchart TB
  Browser[Employee browser]
  CF[CloudFront distribution]
  S3[S3 private origin<br/>frontend assets]
  IGW[Internet Gateway]
  subgraph VPC[TeamPulse VPC across two AZs]
    subgraph Public[Public subnets]
      ALB[HTTPS Application Load Balancer]
      NAT[NAT Gateway for controlled outbound updates]
    end
    subgraph App[Private application subnets]
      ECS[ECS services<br/>Identity · Habits · Challenges<br/>Events · Insights · Recommendations · Notifications]
      LAMBDA[Lambda consumers]
    end
    subgraph Data[Isolated data subnets]
      DB[(Transactional and document databases)]
      EB[EventBridge event bus]
      ECR[ECR image registry]
      SM[Secrets Manager]
      CW[CloudWatch logs, metrics, alarms]
    end
  end
  Browser --> CF --> S3
  Browser -->|HTTPS API| IGW --> ALB --> ECS
  ECS --> DB
  ECS --> EB --> LAMBDA --> DB
  ECS --> ECR
  ECS --> SM
  ECS --> CW
  LAMBDA --> CW
  ECS --> NAT
```

## Security boundaries

- Only CloudFront and the ALB accept public client traffic. The ALB terminates TLS and forwards only to ECS targets.
- ECS tasks run in private application subnets. Database endpoints have no public route and accept traffic only from the API task security group on the required database port.
- Security groups are stateful and service-specific. Network ACLs provide subnet-level guardrails; private subnets and route tables constrain paths between tiers.
- Task execution roles pull images from ECR and write logs. Separate task roles grant each service only its required database and event permissions.
- Secrets Manager stores secrets; nonsecret configuration is supplied separately through task environment configuration. TLS protects public and service connections where supported.
- CloudWatch collects service and function logs, request latency, API failures, authentication failures, queue/event processing health, and task restarts; alarms notify operators.

## Trade-offs

Subnet isolation and narrow IAM permissions reduce exposure but add networking and deployment work. Aggregated manager insight endpoints protect employee privacy while limiting manager drill-down. Event-driven processing decouples workloads but requires idempotency, retries, and operational monitoring.
