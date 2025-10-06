# transfer_demo_fasta.sh
#!/bin/bash
# Transfer fasta files to storage location inside lab node docker volume
echo "Transferring demo fasta files to lab node docker volume..."
echo "$@"

for var in "$@"
do
  container=$(docker ps -aqf "name=$var.api-1")
  source=./automation/demo_data/fasta/$var
  dest=$container:user/code/data/fasta/

  node="$(echo $var | tr a-z A-Z)"
  echo $node
  count=$(find "$source" -type f | wc -l)

  for ((i=1; i<=$count; i++))
  do
    echo "$i/$count"
    docker cp $source/H2SEQ_"$node"_$i.fasta $dest
  done

done

