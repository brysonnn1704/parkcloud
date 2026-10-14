# AWS Budgets: Conservative Cost Control Alert ($25 USD / ~₹2,100 INR)
resource "aws_budgets_budget" "cost_budget" {
  name              = "${var.project_name}-monthly-cost-budget"
  budget_type       = "COST"
  limit_amount      = "25"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2026-10-01_00:00"

  # 1. 50% threshold notification ($12.50 USD / ~₹1,050 INR)
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.notification_email]
  }

  # 2. 80% threshold notification ($20.00 USD / ~₹1,680 INR)
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.notification_email]
  }

  # 3. 100% threshold notification ($25.00 USD / ~₹2,100 INR)
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.notification_email]
  }
}
