pipeline {
    agent any
    // options {
    //     // Timeout counter starts AFTER agent is allocated
    //     timeout(time: 1, unit: 'SECONDS')
    // }
    environment {
        GIT_COMMIT_SHORT = sh(
                script: "printf \$(git rev-parse --short ${GIT_COMMIT})",
                returnStdout: true
        )
        HELM_CHART_FILE = sh(
            script: 'find . -name "Chart.yaml" -type f', 
            returnStdout: true
        )
        BUILD_NUM_ENV = currentBuild.getNumber()
        IMAGE_NAME = "northamerica-northeast2-docker.pkg.dev/my-cd-cd-learn-gke/flux-test-docker/flux-test-noderest-api-app"
        IMAGE_TAG = "${BUILD_NUM_ENV}-${GIT_COMMIT_SHORT}"
        GCP_PROJECT = "my-cd-cd-learn-gke"
    }
    stages {
        stage('Checkout source repo') {
            steps {
                git branch: 'simple_rest_api',
                credentialsId: 'github-id',
                url: 'https://github.com/pardhap18/rest-api-sample.git'
            }
        }
        stage('Image creation') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                /*
                withDockerRegistry([credentialsId: "my-cd-cd-learn-gke", url: "https://northamerica-northeast2-docker.pkg.dev"]) {
                    sh 'docker push ${IMAGE_NAME}:${IMAGE_TAG}'
                }
                
                script {
                    docker.withRegistry('https://gcr.io', 'gcr:my-cd-cd-learn-gke') {
                        def image = docker.image("${IMAGE_NAME}:${IMAGE_TAG}");
                        image.push()
                    }
                }
                */

                /*

                withCredentials([file(credentialsId: 'gcp-creds', variable: 'GC_KEY')]) {
                    sh("gcloud auth activate-service-account --key-file=${GC_KEY}")
                    sh("gcloud auth configure-docker northamerica-northeast2-docker.pkg.dev")
                    sh("docker push ${IMAGE_NAME}:${IMAGE_TAG}")
                }
                
                //sh 'docker rmi ${IMAGE_NAME}:${IMAGE_TAG}'
                echo 'Build docker image Finish'
                */
            }
        }

            /* Local Registry ->
            steps {
                sh '''
                    docker build -t flux-test-app:${BUILD_NUM_ENV}-${GIT_COMMIT_SHORT} .
                    docker tag flux-test-app:${BUILD_NUM_ENV}-${GIT_COMMIT_SHORT} localhost:5000/flux-test-app:${BUILD_NUM_ENV}-${GIT_COMMIT_SHORT}
                    docker push localhost:5000/flux-test-app:${BUILD_NUM_ENV}-${GIT_COMMIT_SHORT}
                '''
            }
            */
        stage('Checkout Charts') {
            steps {
                git branch: 'main',
                credentialsId: 'github-id',
                url: 'https://github.com/pardhap18/separated-flux-test-helm-charts.git'
            }

        }
        stage('Update Chart Info') {
            steps {
                
                sh '''
                    git config --global user.email "pardhap18@gmail.com"
                    git config --global user.name "Pardha"
                    git checkout -b feature/dev-flux-test-noderest-api-app-${BUILD_NUM_ENV}-changes
                '''
                script {
                    datas = readYaml (file: './flux-test-noderest-api-app/Chart.yaml')
                    new_chart_version = nextVersion('major', datas.version)
                    echo "Got version as ${datas.version} and New Version is ${new_chart_version}"
                    datas.version = new_chart_version
                    datas.appVersion = "${BUILD_NUM_ENV}-${GIT_COMMIT_SHORT}"
                }
                sh "rm -rf ./flux-test-noderest-api-app/Chart.yaml"
                script {
                    writeYaml (file: './flux-test-noderest-api-app/Chart.yaml', data: datas)
                }
            }
            
        }
        stage('Dev Promotion') {
            steps {
                sh("docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:dev-${IMAGE_TAG}")
                withCredentials([file(credentialsId: 'gcp-creds', variable: 'GC_KEY')]) {
                    sh("gcloud auth activate-service-account --key-file=${GC_KEY}")
                    sh("gcloud auth configure-docker northamerica-northeast2-docker.pkg.dev")
                    sh("docker push ${IMAGE_NAME}:dev-${IMAGE_TAG}")
                }
                
                sh("docker rmi ${IMAGE_NAME}:dev-${IMAGE_TAG}")
                echo 'Build Push Finish'
                script {
                    tag_data = readYaml (file: './flux-test-noderest-api-app/values-dev.yaml')
                    echo "Got version as ${tag_data.image.tag}"
                    tag_data.image.tag = "dev-${IMAGE_TAG}" 
                }
                sh "rm -rf ./flux-test-noderest-api-app/values-dev.yaml"
                script {
                    writeYaml (file: './flux-test-noderest-api-app/values-dev.yaml', data: tag_data)
                }
                // Creation of Remote branch
                withCredentials([
                    gitUsernamePassword(credentialsId: 'github-id', gitToolName: 'Default')
                ]) {
                    sh '''
                        git config --global user.email "pardhap18@gmail.com"
                        git config --global user.name "Pardha"
                        git add .
                        git commit -am  "flux-test-noderest-api-app ${BUILD_NUM_ENV}-${GIT_COMMIT_SHORT} dev Changes"
                        git push -u origin feature/dev-flux-test-noderest-api-app-${BUILD_NUM_ENV}-changes
                    '''
                    //git request-pull origin/main feature/dev-flux-test-noderest-api-app-${BUILD_NUM_ENV}-changes
                }
                // github cli action
                withCredentials([usernamePassword(credentialsId: 'github-id', passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                    sh(label: 'gh auth login', script: "echo \${GIT_PASSWORD}|gh auth login --with-token")
                    sh("gh pr create --base main --head feature/dev-flux-test-noderest-api-app-${BUILD_NUM_ENV}-changes --title dev-deploy-${BUILD_NUM_ENV}-changes --body dev-flux-test-noderest-api-app-${BUILD_NUM_ENV}-changes")
                    //sh(label: 'gh logout', script: 'gh auth logout')

                }
                
            }
        }
        stage('Stage Promotion') {
            steps {
                sh("docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:stg-${IMAGE_TAG}")
                withCredentials([file(credentialsId: 'gcp-creds', variable: 'GC_KEY')]) {
                    sh("gcloud auth activate-service-account --key-file=${GC_KEY}")
                    sh("gcloud auth configure-docker northamerica-northeast2-docker.pkg.dev")
                    sh("docker push ${IMAGE_NAME}:stg-${IMAGE_TAG}")
                }
                
                sh("docker rmi ${IMAGE_NAME}:stg-${IMAGE_TAG}")
                echo 'Build Push Finish'
                sh '''
                    git config --global user.email "pardhap18@gmail.com"
                    git config --global user.name "Pardha"
                    git checkout -b feature/stg-flux-test-noderest-api-app-${BUILD_NUM_ENV}-changes
                '''
                script {
                    tag_data = readYaml (file: './flux-test-noderest-api-app/values-staging.yaml')
                    echo "Got version as ${tag_data.image.tag}"
                    tag_data.image.tag = "stg-${IMAGE_TAG}" 
                }
                sh "rm -rf ./flux-test-noderest-api-app/values-staging.yaml"
                script {
                    writeYaml (file: './flux-test-noderest-api-app/values-staging.yaml', data: tag_data)
                }
                // Creation of Remote branch
                withCredentials([
                    gitUsernamePassword(credentialsId: 'github-id', gitToolName: 'Default')
                ]) {
                    sh '''
                        git config --global user.email "pardhap18@gmail.com"
                        git config --global user.name "Pardha"
                        git add .
                        git commit -am  "flux-test-noderest-api-app ${BUILD_NUM_ENV}-${GIT_COMMIT_SHORT} stg Changes"
                        git push -u origin feature/stg-flux-test-noderest-api-app-${BUILD_NUM_ENV}-changes
                    '''
                    //git request-pull origin/main feature/stg-flux-test-noderest-api-app-${BUILD_NUM_ENV}-changes
  
                }
                withCredentials([usernamePassword(credentialsId: 'github-id', passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                    sh(label: 'gh auth login', script: "echo \${GIT_PASSWORD}|gh auth login --with-token")
                    sh("gh pr create --base main --head feature/stg-flux-test-noderest-api-app-${BUILD_NUM_ENV}-changes --title stg-deploy-${BUILD_NUM_ENV}-changes --body stg-flux-test-noderest-api-app-${BUILD_NUM_ENV}-changes")
                    //sh(label: 'gh logout', script: 'gh auth logout')

                }
                
            }
        }
        /*
        stage('Git Push') {
            steps {
                withCredentials([
                    gitUsernamePassword(credentialsId: 'github-id', gitToolName: 'Default')
                ]) {
                    sh '''
                        git config --global user.email "pardhap18@gmail.com"
                        git config --global user.name "Pardha"
                        git add .
                        git commit -am "flux-test-noderest-api-app ${BUILD_NUM_ENV}-${GIT_COMMIT_SHORT} Changes"
                        git push -u origin main
                    '''
                }
            }
            
        }
        */
    }
       
}

def nextVersion(scope, latestVersion) {
    def major = (latestVersion.tokenize('.')[0]).toInteger()
    def minor = (latestVersion.tokenize('.')[1]).toInteger()
    def patch = (latestVersion.tokenize('.')[2]).toInteger()
    def nextVersion
    switch (scope) {
        case 'major':
            nextVersion = "${major + 1}.${minor}.${patch}"
            break
        case 'minor':
            nextVersion = "${major}.${minor + 1}.${patch}"
            break
        case 'patch':
            nextVersion = "${major}.${minor}.${patch + 1}"
            break
    }
    return nextVersion
}