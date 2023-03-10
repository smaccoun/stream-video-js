#!/bin/bash

# the sdk's name in the folder under packages/*/docusaurus/docs/?/
SDK_DIR_IN_DOCS=$1;
# value of the name property in package.json. i.e @stream-io/video-*
PACKAGE_NAME=$2;
# package name of the SDK. i.e react-native-sdk
PACKAGE_DIR_NAME=$3;

ROOT_PROJ_DIR=$(dirname "$0")
cd "$ROOT_PROJ_DIR/.." || exit
cd "packages/$PACKAGE_DIR_NAME/" || exit

echo "Generating docs from the client..."
yarn workspace @stream-io/video-client run clean:docs > /dev/null
yarn workspace @stream-io/video-client run generate-docs:classes > /dev/null

echo "Generating docs from react-bindings..."
yarn generate-docs:react:bindings > /dev/null

echo "Generating docs from $PACKAGE_NAME SDK..."

# clean up old docs
rm -rf generated-docs
rm -rf "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine/"
rm -rf "docusaurus/docs/$SDK_DIR_IN_DOCS/07-reference/"

# generate new docs
npx typedoc --options typedoc.json

# preprocess the docs to our specific needs
npx replace-in-file "# $PACKAGE_NAME" '# Components' 'temp-docs/**' > /dev/null
npx replace-in-file '# Interface: ' '# ' 'temp-docs/**' > /dev/null
npx replace-in-file '/interfaces/g' '../Interfaces' 'temp-docs/modules.md' --isRegex > /dev/null
npx replace-in-file '/\.md/g' '/' 'temp-docs/modules.md' --isRegex > /dev/null
npx replace-in-file '/modules\//g' '' 'temp-docs/modules.md' --isRegex > /dev/null

#copy from the temp-docs to the structure we want in docusaurus
mkdir generated-docs
mkdir "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine"
mkdir "docusaurus/docs/$SDK_DIR_IN_DOCS/07-reference"
touch "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine/_category_.json"
touch "docusaurus/docs/$SDK_DIR_IN_DOCS/07-reference/_category_.json"
echo "{
  \"label\": \"Call Engine\",
  \"position\": 4
}" > "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine/_category_.json"
echo "{
  \"label\": \"Reference\",
  \"position\": 7
}" > "docusaurus/docs/$SDK_DIR_IN_DOCS/07-reference/_category_.json"
cp -a temp-docs/interfaces/. generated-docs/Interfaces/
cp temp-docs/modules.md generated-docs/components.md
rm -rf temp-docs

# move client docs to SDK's docs and mark as generated
cp -a ../client/docusaurus/docs/client/. generated-docs/client/
cd generated-docs/client || exit
for sub_directories in * ;
do
  (
    cd "$sub_directories" || exit
    for f in * ; do mv -- "$f" "${f%.*}.gen.${f##*.}" ; done
  )
done

cd ../../

cp -a ./generated-docs/client/. "docusaurus/docs/$SDK_DIR_IN_DOCS/"
rm -rf generated-docs/client/

# copy shared JS docs to the docs to SDK's docusaurus
cp -a ../client/generated-docs/. "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine/"
cp -a ../react-bindings/generated-docs/. "docusaurus/docs/$SDK_DIR_IN_DOCS/07-reference/"
cp -a ./generated-docs/. "docusaurus/docs/$SDK_DIR_IN_DOCS/07-reference/"

echo "Done!"
