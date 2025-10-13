from app.database import session_generator, Base
from app.logger import logger

RecordsLinked = Base.classes.RecordsLinked
MetadataLinked = Base.classes.MetadataLinked

def get_all_records_linked():
    with session_generator() as session:
        return session.query(RecordsLinked).all()
    
def get_all_metadata_linked():
    with session_generator() as session:
        return session.query(MetadataLinked).all()
    

def group_metadata_by_record():
    with session_generator() as session:
        query = session.query(
            RecordsLinked.id,
            RecordsLinked.external_id,
            MetadataLinked.column_name,
            MetadataLinked.value).outerjoin(
                MetadataLinked,
                RecordsLinked.external_id == MetadataLinked.external_id)
        
        results = query.all()
        
        grouped = {}

        for id_, external_id, column_name, value in results:
            if id_ not in grouped:
                grouped[id_] = {
                    'id': id_,
                    'external_id': external_id,
                    'metadata': {}
                }
            if column_name:
                grouped[id_]['metadata'][column_name] = value

        return list(grouped.values())