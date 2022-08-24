This is about pushing logs to Cloudwatch. It's copied from [this article](https://wdullaer.com/blog/2016/02/28/pass-credentials-to-the-awslogs-docker-logging-driver-on-ubuntu/)

First, Create a user in AWS with permissions to write to Cloudwatch

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
```

For Ubuntu above version 14, you need to set AWS credentials using systemd

```sh
mkdir -p /etc/systemd/system/docker.service.d/
touch /etc/systemd/system/docker.service.d/aws-credentials.conf
```

Then write to this file with:

```
[Service]
Environment="AWS_ACCESS_KEY_ID=..."
Environment="AWS_SECRET_ACCESS_KEY=..."
```

And run:

```sh
sudo systemctl daemon-reload
sudo service docker restart
```

To test it, run this hello world container:

```sh
docker -D run --rm -it \
  --log-driver=awslogs \
  --log-opt awslogs-region=eu-central-1 \
  --log-opt awslogs-group=docker-log-test \
  --log-opt awslogs-stream=hello-world hello-world
```